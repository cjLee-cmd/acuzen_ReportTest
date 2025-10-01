// 간단한 유틸
const qs = (s) => document.querySelector(s);
const headerOut = qs('#headerOut');
const tagOut = qs('#tagOut');
const tagBars = qs('#tagBars');
const reportTree = qs('#reportTree');
const reportRaw = qs('#reportRaw');
const tagInfo = qs('#tagInfo');
const prevReportBtn = qs('#prevReport');
const nextReportBtn = qs('#nextReport');
const reportCounter = qs('#reportCounter');

const fileInput = qs('#file');
const dropzone = qs('#dropzone');
const sampleMBEl = qs('#sampleMB');
const chunkKBEl = qs('#chunkKB');

const btnHeader = qs('#btnHeader');
const btnFirstReport = qs('#btnFirstReport');
const btnScanTags = qs('#btnScanTags');
const btnScanTagsFull = qs('#btnScanTagsFull');
const btnReset = qs('#btnReset');
const btnCancel = qs('#btnCancel');

let currentFile = null;
const progressEl = qs('#progress');
const progressPct = qs('#progressPct');
const statusText = qs('#statusText');
const statsLine = qs('#statsLine');
let _opCanceled = false;
let _opStart = 0;
let _opTotal = 0;

let reportOffsets = [];
let reportCache = new Map();
let reportIndexPromise = null;
let reportIndexComplete = false;
let currentReportIndex = -1;
const REPORT_CACHE_LIMIT = 20;

function setBusy(b) {
  // 작업 중에는 취소 버튼만 활성화
  btnHeader.disabled = b;
  btnFirstReport.disabled = b;
  btnScanTags.disabled = b;
  btnScanTagsFull.disabled = b;
  btnReset.disabled = b;
  btnCancel.disabled = !b;
  if (b) {
    prevReportBtn.disabled = true;
    nextReportBtn.disabled = true;
  } else {
    updateNavButtons();
  }
}

function handleNewFile(file) {
  currentFile = file;
  resetReportState();
  if (file) {
    headerOut.textContent = `선택된 파일: ${file.name} (${file.size.toLocaleString()} bytes)`;
  }
}

// 파일 선택/드롭
fileInput.addEventListener('change', () => {
  handleNewFile(fileInput.files[0] || null);
});

dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('drag');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag'));
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('drag');
  const f = e.dataTransfer.files && e.dataTransfer.files[0];
  if (f) {
    handleNewFile(f);
  }
});

function getSizes() {
  const sampleBytes = Math.max(1, Number(sampleMBEl.value || 2)) * 1024 * 1024;
  const chunkBytes = Math.max(128, Number(chunkKBEl.value || 512)) * 1024;
  return { sampleBytes, chunkBytes };
}

function readChunk(file, start, length) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(reader.result);
    const blob = file.slice(start, start + length);
    reader.readAsText(blob);
  });
}

function readBuffer(file, start, length) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(reader.result);
    const blob = file.slice(start, start + length);
    reader.readAsArrayBuffer(blob);
  });
}

async function readHead(file, bytes) {
  const text = await readChunk(file, 0, Math.min(bytes, file.size));
  return text;
}

function extractHeaderMeta(text) {
  const lines = text.split(/\r?\n/).slice(0, 120).join('\n');
  const rootMatch = lines.match(/<([a-zA-Z_][\w:.-]*)[\s>]/);
  const doctype = (lines.match(/<!DOCTYPE[^>]+>/) || [''])[0];
  return { preview: lines, root: rootMatch ? rootMatch[1] : 'unknown', doctype };
}

// 태그 스캔(스트리밍) — 시작 태그 카운트
async function scanTags(file, maxBytes, chunkBytes) {
  const counts = new Map();
  let offset = 0;
  let carry = '';
  const limit = Math.min(maxBytes, file.size);
  while (offset < limit) {
    const remaining = limit - offset;
    const length = Math.min(chunkBytes, remaining);
    const text = await readChunk(file, offset, length);
    offset += length;
    let buf = carry + text;
    // 경계 처리: 마지막 64자를 carry로 유지
    carry = buf.slice(-64);
    const scan = buf.slice(0, Math.max(0, buf.length - 64));
    const re = /<([A-Za-z][A-Za-z0-9_.:-]*)/g;
    let m;
    while ((m = re.exec(scan))) {
      const t = m[1];
      counts.set(t, (counts.get(t) || 0) + 1);
    }
    updateProgress(offset, limit);
  }
  return counts;
}

const encoder = new TextEncoder();
const OPEN_SEQ = encoder.encode('<safetyreport');
const CLOSE_SEQ = encoder.encode('</safetyreport>');
const CARRY_LIMIT_BYTES = Math.max(OPEN_SEQ.length, CLOSE_SEQ.length) + 8192;

function findSequence(haystack, needle, from) {
  outer: for (let i = from; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return i;
  }
  return -1;
}

async function indexAllSafetyReports(file, chunkBytes) {
  reportOffsets = [];
  reportCache = new Map();
  reportIndexComplete = false;
  let offset = 0;
  let carryBytes = new Uint8Array(0);
  let currentStart = null;
  let currentStartLocal = 0;

  while (offset < file.size) {
    if (_opCanceled) throw new Error('cancelled');
    const chunkStart = offset;
    const length = Math.min(chunkBytes, file.size - offset);
    const buffer = await readBuffer(file, chunkStart, length);
    const chunk = new Uint8Array(buffer);
    const combined = new Uint8Array(carryBytes.length + chunk.length);
    combined.set(carryBytes, 0);
    combined.set(chunk, carryBytes.length);
    const basePos = chunkStart - carryBytes.length;

    let searchPos = 0;
    while (true) {
      if (currentStart === null) {
        const openIdx = findSequence(combined, OPEN_SEQ, searchPos);
        if (openIdx === -1) break;
        currentStart = basePos + openIdx;
        currentStartLocal = openIdx;
        searchPos = openIdx + 1;
      }
      if (currentStart !== null) {
        const closeIdx = findSequence(combined, CLOSE_SEQ, searchPos);
        if (closeIdx === -1) break;
        const endAbs = basePos + closeIdx + CLOSE_SEQ.length;
        reportOffsets.push({ start: currentStart, end: endAbs });
        currentStart = null;
        currentStartLocal = 0;
        searchPos = closeIdx + CLOSE_SEQ.length;
      }
    }

    if (currentStart !== null) {
      const startLocalBytes = Math.max(0, currentStartLocal);
      carryBytes = combined.slice(startLocalBytes);
    } else {
      const keep = Math.min(CARRY_LIMIT_BYTES, combined.length);
      carryBytes = combined.slice(combined.length - keep);
    }

    offset += length;
    updateProgress(offset, file.size);
  }

  if (_opCanceled) throw new Error('cancelled');
  reportIndexComplete = true;
  return reportOffsets.length;
}

async function ensureReportsIndexed(chunkBytes) {
  if (reportIndexComplete && reportOffsets.length) return reportOffsets.length;
  if (reportIndexPromise) return reportIndexPromise;
  reportIndexPromise = (async () => {
    startProgress('safetyreport 인덱싱 중…');
    try {
      const total = await indexAllSafetyReports(currentFile, chunkBytes);
      finishProgress('ok');
      return total;
    } catch (err) {
      if (_opCanceled) {
        finishProgress('canceled');
      } else {
        finishProgress('error');
      }
      resetReportState();
      throw err;
    } finally {
      reportIndexPromise = null;
    }
  })();
  return reportIndexPromise;
}

async function loadReportXml(index) {
  if (reportCache.has(index)) return reportCache.get(index);
  const meta = reportOffsets[index];
  if (!meta) return '';
  const xml = await readChunk(currentFile, meta.start, meta.end - meta.start);
  reportCache.set(index, xml);
  if (reportCache.size > REPORT_CACHE_LIMIT) {
    const firstKey = reportCache.keys().next().value;
    if (firstKey !== undefined && firstKey !== index) {
      reportCache.delete(firstKey);
    }
  }
  return xml;
}

async function showReportAt(targetIndex) {
  if (!currentFile) {
    alert('먼저 XML 파일을 선택하세요.');
    return;
  }
  const { chunkBytes } = getSizes();
  setBusy(true);
  let loadProgressStarted = false;
  try {
    await ensureReportsIndexed(chunkBytes);
    if (!reportOffsets.length) {
      reportTree.innerHTML = '<div class="muted">safetyreport 태그를 찾지 못했습니다.</div>';
      reportRaw.textContent = '';
      currentReportIndex = -1;
      updateNavButtons();
      return;
    }
    const maxIndex = reportOffsets.length - 1;
    const idx = Math.min(Math.max(targetIndex, 0), maxIndex);
    startProgress('safetyreport 로드 중…');
    loadProgressStarted = true;
    const xml = await loadReportXml(idx);
    updateProgress(reportOffsets[idx].end - reportOffsets[idx].start, reportOffsets[idx].end - reportOffsets[idx].start);
    finishProgress('ok');
    const entries = buildTreeFromXml(xml);
    reportTree.innerHTML = renderTree(entries);
    reportRaw.textContent = prettyXml(xml);
    currentReportIndex = idx;
    updateNavButtons();
  } catch (err) {
    if (err && err.message === 'cancelled') {
      // 취소 시 별도 메시지 유지
    } else {
      reportTree.innerHTML = '<div class="muted">보고 불러오기 실패</div>';
      reportRaw.textContent = '';
      if (loadProgressStarted) finishProgress('error');
    }
  } finally {
    setBusy(false);
  }
}

function prettyXml(xml) {
  // 매우 단순한 pretty: 태그 단위 들여쓰기
  const P = xml
    .replace(/>\s+</g, '><')
    .replace(/</g, '\n<')
    .trim()
    .split(/\n+/);
  let indent = 0;
  const out = [];
  for (const line of P) {
    if (/^<\//.test(line)) indent = Math.max(0, indent - 1);
    out.push('  '.repeat(indent) + line);
    if (/^<[^!?][^>/]*[^/]?>$/.test(line)) indent += 1;
  }
  return out.join('\n');
}

function buildTreeFromXml(xml) {
  try {
    const dom = new DOMParser().parseFromString(xml, 'application/xml');
    if (dom.querySelector('parsererror')) return null;
    const root = dom.documentElement;
    const entries = [];

    const walk = (el) => {
      if (!(el instanceof Element)) return;
      // 직접 텍스트 노드 수집
      let directText = '';
      for (const node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          directText += node.nodeValue;
        }
      }
      const value = directText.trim();
      if (value) {
        entries.push({ tag: el.tagName, value });
      }
      for (const child of el.children) {
        walk(child);
      }
    };

    walk(root);
    return entries;
  } catch (_) {
    return null;
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderTree(entries) {
  if (!entries || !entries.length) {
    return '<div class="muted">표시할 값이 없습니다.</div>';
  }
  const rows = entries.map(({ tag, value }) => {
    const safeTag = escapeHtml(tag);
    const safeVal = escapeHtml(value);
    return `<li><span class="tag" data-tag="${safeTag}">${safeTag}</span>:<span class="val">${safeVal}</span></li>`;
  });
  return `<div class="tree"><ul class="kv-list">${rows.join('')}</ul></div>`;
}

function renderBars(map) {
  const arr = Array.from(map.entries()).sort((a,b)=>b[1]-a[1]).slice(0, 20);
  const max = arr.length ? arr[0][1] : 1;
  return arr.map(([k,v]) => {
    const w = Math.max(4, Math.round((v / max) * 100));
    return `<div class="bar"><button class="label asLink" data-tag="${k}">${k}</button><div class="meter"><div class="fill" style="width:${w}%"></div></div><div class="count">${v}</div></div>`;
  }).join('');
}

function resetReportState() {
  reportOffsets = [];
  reportCache = new Map();
  reportIndexPromise = null;
  reportIndexComplete = false;
  currentReportIndex = -1;
  updateNavButtons();
}

function updateNavButtons() {
  const total = reportOffsets.length;
  const current = currentReportIndex >= 0 ? currentReportIndex + 1 : 0;
  reportCounter.textContent = `${current} / ${total}`;
  const disablePrev = currentReportIndex <= 0;
  const disableNext = currentReportIndex === -1 || currentReportIndex >= total - 1;
  prevReportBtn.disabled = disablePrev;
  nextReportBtn.disabled = disableNext;
}

btnHeader.addEventListener('click', async () => {
  if (!currentFile) { alert('먼저 XML 파일을 선택하세요.'); return; }
  setBusy(true);
  try {
    const { sampleBytes } = getSizes();
    startProgress('헤더 읽는 중…');
    const text = await readHead(currentFile, sampleBytes);
    const meta = extractHeaderMeta(text);
    headerOut.textContent = `Root: ${meta.root}\n${meta.doctype || ''}\n\n--- Preview ---\n${meta.preview}`;
    finishProgress('ok');
  } catch (e) {
    headerOut.textContent = '헤더 읽기 실패: ' + e;
    finishProgress('error');
  } finally { setBusy(false); }
});

btnFirstReport.addEventListener('click', () => {
  showReportAt(0);
});

prevReportBtn.addEventListener('click', () => {
  if (currentReportIndex > 0) {
    showReportAt(currentReportIndex - 1);
  }
});

nextReportBtn.addEventListener('click', () => {
  if (reportOffsets.length && currentReportIndex < reportOffsets.length - 1) {
    showReportAt(currentReportIndex + 1);
  }
});

btnScanTags.addEventListener('click', async () => {
  if (!currentFile) { alert('먼저 XML 파일을 선택하세요.'); return; }
  setBusy(true);
  try {
    const { sampleBytes, chunkBytes } = getSizes();
    startProgress('태그 스캔(샘플) 중…');
    const counts = await scanTags(currentFile, sampleBytes, chunkBytes);
    tagBars.innerHTML = renderBars(counts);
    tagOut.textContent = Array.from(counts.entries())
      .sort((a,b)=>b[1]-a[1])
      .map(([k,v])=>`${k}\t${v}`)
      .slice(0, 200)
      .join('\n');
    finishProgress(_opCanceled ? 'canceled' : 'ok');
  } catch (e) {
    tagOut.textContent = '스캔 실패: ' + e;
    finishProgress('error');
  } finally { setBusy(false); }
});

btnScanTagsFull.addEventListener('click', async () => {
  if (!currentFile) { alert('먼저 XML 파일을 선택하세요.'); return; }
  const ok = confirm('전체 파일을 스캔합니다. 시간이 오래 걸릴 수 있습니다. 진행할까요?');
  if (!ok) return;
  setBusy(true);
  try {
    const { chunkBytes } = getSizes();
    startProgress('태그 스캔(전체) 중…');
    const counts = await scanTags(currentFile, currentFile.size, chunkBytes);
    tagBars.innerHTML = renderBars(counts);
    tagOut.textContent = Array.from(counts.entries())
      .sort((a,b)=>b[1]-a[1])
      .map(([k,v])=>`${k}\t${v}`)
      .join('\n');
    finishProgress(_opCanceled ? 'canceled' : 'ok');
  } catch (e) {
    tagOut.textContent = '스캔 실패: ' + e;
    finishProgress('error');
  } finally { setBusy(false); }
});

btnReset.addEventListener('click', () => {
  headerOut.textContent = '';
  tagBars.innerHTML = '';
  tagOut.textContent = '';
  reportTree.innerHTML = '';
  reportRaw.textContent = '';
  tagInfo.innerHTML = '<span class="muted">트리/막대의 태그를 클릭하면 설명이 표시됩니다.</span>';
  resetReportState();
  resetProgressUI();
});

btnCancel.addEventListener('click', () => {
  _opCanceled = true;
  statusText.textContent = '취소 중…';
});

resetReportState();

// 프로그래스 바
function startProgress(label) {
  progressEl.max = 100;
  progressEl.value = 0;
  progressPct.textContent = '0%';
  statusText.textContent = label || '진행 중…';
  statsLine.textContent = '처리 0 / 0 • 속도 0 MB/s • 경과 00:00 • 예상 00:00';
  _opCanceled = false;
  _opStart = Date.now();
  _opTotal = 0;
}
function updateProgress(doneBytes, totalBytes) {
  const pct = totalBytes > 0 ? Math.floor((doneBytes / totalBytes) * 100) : 0;
  progressEl.value = pct;
  progressPct.textContent = pct + '%';
  _opTotal = totalBytes;
  const elapsedSec = Math.max(0.001, (Date.now() - _opStart) / 1000);
  const rateBps = doneBytes / elapsedSec;
  const remainSec = rateBps > 0 ? Math.max(0, (totalBytes - doneBytes) / rateBps) : 0;
  statsLine.textContent = `처리 ${fmtBytes(doneBytes)} / ${fmtBytes(totalBytes)} • 속도 ${fmtRate(rateBps)} • 경과 ${fmtTime(elapsedSec)} • 예상 ${fmtTime(remainSec)}`;
  if (_opCanceled) {
    statusText.textContent = '취소 중…';
  }
}
function finishProgress(mode='ok') {
  if (mode === 'error') {
    statusText.textContent = '오류';
    return;
  }
  if (mode === 'canceled') {
    statusText.textContent = '취소됨';
    // 퍼센트/스탯은 유지
    return;
  }
  progressEl.value = 100;
  progressPct.textContent = '100%';
  statusText.textContent = '완료';
}
function resetProgressUI() {
  progressEl.value = 0;
  progressPct.textContent = '0%';
  statusText.textContent = '대기 중';
  statsLine.textContent = '처리 0 / 0 • 속도 0 MB/s • 경과 00:00 • 예상 00:00';
}

function fmtBytes(b) {
  if (!isFinite(b)) return '0 B';
  const u = ['B','KB','MB','GB'];
  let i = 0; let x = b;
  while (x >= 1024 && i < u.length-1) { x /= 1024; i++; }
  return `${x.toFixed(x<10?2:1)} ${u[i]}`;
}
function fmtRate(bps) {
  // MB/s 기준 표시
  const mbps = bps / (1024*1024);
  return `${mbps.toFixed(mbps<10?2:1)} MB/s`;
}
function fmtTime(sec) {
  const s = Math.round(sec);
  const mm = String(Math.floor(s/60)).padStart(2,'0');
  const ss = String(s%60).padStart(2,'0');
  return `${mm}:${ss}`;
}

// 태그 사전(요약). 필요 시 확장 가능
const DICT = {
  ichicsr: { desc: 'ICSR 루트', codes: 'ICH ICSR(E2B R2)' },
  ichicsrmessageheader: { desc: '메시지 헤더', codes: 'ICH ICSR' },
  messagetype: { desc: '메시지 유형', codes: '-' },
  messageformatversion: { desc: 'ICSR 포맷 버전', codes: 'ICH ICSR' },
  messageformatrelease: { desc: 'ICSR 릴리스', codes: 'ICH ICSR' },
  messagenumb: { desc: '메시지 일련/배치', codes: '-' },
  messagedateformat: { desc: '날짜형식 코드', codes: 'date_format' },
  messagedate: { desc: '메시지 일시', codes: 'date_format' },
  safetyreport: { desc: '개별 이상사례 보고', codes: 'ICH ICSR' },
  safetyreportid: { desc: '보고서 ID', codes: '-' },
  safetyreportversion: { desc: '보고서 버전', codes: '-' },
  primarysourcecountry: { desc: '원보고 국가', codes: 'ISO 3166-1' },
  transmissiondateformat: { desc: '전송일시 형식', codes: 'date_format' },
  transmissiondate: { desc: '전송일시', codes: 'date_format' },
  reporttype: { desc: '보고 유형', codes: 'report_type' },
  serious: { desc: '중대성 여부', codes: 'serious_flag' },
  seriousnessdeath: { desc: '사망 관련성', codes: 'serious_flag' },
  seriousnesslifethreatening: { desc: '생명위협', codes: 'serious_flag' },
  seriousnesshospitalization: { desc: '입원/연장', codes: 'serious_flag' },
  seriousnessdisabling: { desc: '장애/무능', codes: 'serious_flag' },
  seriousnesscongenitalanomali: { desc: '선천성기형', codes: 'serious_flag' },
  seriousnessother: { desc: '기타 중대성', codes: 'serious_flag' },
  receivedateformat: { desc: '수신일자 형식', codes: 'date_format' },
  receivedate: { desc: '수신일자', codes: 'date_format' },
  receiptdateformat: { desc: '수신일자 형식(현재)', codes: 'date_format' },
  receiptdate: { desc: '수신일자(현재)', codes: 'date_format' },
  primarysource: { desc: '원보고자', codes: '-' },
  reportercountry: { desc: '보고자 국가', codes: 'ISO 3166-1' },
  qualification: { desc: '보고자 자격', codes: 'qualification' },
  sender: { desc: '발신 주체', codes: '-' },
  sendertype: { desc: '발신 유형', codes: '-' },
  senderorganization: { desc: '발신 조직', codes: '-' },
  receiver: { desc: '수신 주체', codes: '-' },
  receivertype: { desc: '수신 유형', codes: '-' },
  receiverorganization: { desc: '수신 조직', codes: '-' },
  patient: { desc: '환자 정보', codes: '-' },
  patientsex: { desc: '성별', codes: 'patient_sex' },
  patientweight: { desc: '체중', codes: '-' },
  patientagegroup: { desc: '연령군', codes: '-' },
  patientonsetage: { desc: '발병 연령', codes: '-' },
  patientonsetageunit: { desc: '발병 연령 단위', codes: '-' },
  occurcountry: { desc: '사건 발생국', codes: 'ISO 3166-1' },
  reaction: { desc: '이상반응', codes: 'MedDRA' },
  reactionmeddrapt: { desc: 'MedDRA PT', codes: 'MedDRA' },
  reactionmeddraversionpt: { desc: 'MedDRA 버전', codes: 'MedDRA' },
  reactionoutcome: { desc: '반응 결과', codes: 'reaction_outcome' },
  drug: { desc: '투여 약물', codes: '-' },
  drugcharacterization: { desc: '약물 역할', codes: '-' },
  medicinalproduct: { desc: '제품명', codes: '-' },
  activesubstance: { desc: '유효성분', codes: '-' },
  activesubstancename: { desc: '유효성분명', codes: '-' },
  drugadministrationroute: { desc: '투여경로', codes: 'route' },
  drugdosageform: { desc: '제형', codes: '-' },
  drugdosagetext: { desc: '용량 텍스트', codes: '-' },
  drugstructuredosagenumb: { desc: '구조적 용량 수치', codes: '-' },
  drugstructuredosageunit: { desc: '구조적 용량 단위', codes: '-' },
  drugseparatedosagenumb: { desc: '1회 용량 수치', codes: '-' },
  drugintervaldosageunitnumb: { desc: '투여 간격 수치', codes: '-' },
  drugintervaldosagedefinition: { desc: '투여 간격 정의', codes: 'dose_interval_def' },
  drugtreatmentduration: { desc: '치료 기간', codes: '-' },
  drugtreatmentdurationunit: { desc: '치료 기간 단위', codes: '-' },
  drugstartdateformat: { desc: '시작일 형식', codes: 'date_format' },
  drugstartdate: { desc: '치료 시작일', codes: 'date_format' },
  drugenddateformat: { desc: '종료일 형식', codes: 'date_format' },
  drugenddate: { desc: '치료 종료일', codes: 'date_format' },
  drugbatchnumb: { desc: '제조번호/로트', codes: '-' },
  drugauthorizationnumb: { desc: '허가/승인 번호', codes: '-' },
  actiondrug: { desc: '약물 조치', codes: '-' },
  authoritynumb: { desc: '규제기관 참조번호', codes: '-' },
  companynumb: { desc: '회사 참조번호', codes: '-' },
  duplicate: { desc: '중복 보고 플래그/블록', codes: '-' },
  duplicatenumb: { desc: '중복 참조번호', codes: '-' },
  duplicatesource: { desc: '중복 출처', codes: '-' },
  reportduplicate: { desc: '중복 보고 세부', codes: '-' },
  literaturereference: { desc: '문헌 참고', codes: '-' },
  narrativeincludeclinical: { desc: '임상 서술', codes: '-' },
  summary: { desc: '요약', codes: '-' },
};

function showTagInfo(tag) {
  const d = DICT[tag] || { desc: '정의 없음(추가 예정)', codes: '-' };
  let html = `<div><span class="k">&lt;${tag}&gt;</span> <span class="v">${d.desc}</span></div>`;
  if (d.codes && d.codes !== '-') {
    html += `<div class="codes">코드/체계: ${d.codes} (참조: Codex/codes)</div>`;
  }
  tagInfo.innerHTML = html;
}

// 이벤트: 트리 내 태그 클릭
reportTree.addEventListener('click', (e) => {
  const el = e.target.closest('.tag');
  if (!el) return;
  const tag = el.dataset.tag || el.textContent.replace(/['\s]/g, '');
  if (tag) showTagInfo(tag);
});

// 이벤트: 막대 내 라벨 클릭
tagBars.addEventListener('click', (e) => {
  const el = e.target.closest('[data-tag]');
  if (!el) return;
  const t = el.getAttribute('data-tag');
  if (t) showTagInfo(t);
});
