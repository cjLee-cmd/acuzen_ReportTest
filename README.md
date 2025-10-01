# FAERS XML Viewer (Standalone)

- 위치: `Codex/viewer/`
- 구성: 정적 HTML/CSS/JS. 네트워크/서버 없이 브라우저에서 동작.

## 사용 방법
1. `Codex/viewer/index.html`을 더블클릭(또는 브라우저로 열기)
2. 상단에서 XML 파일 선택(예: `XML/1_ADR25Q2.xml`) 또는 드래그 앤 드롭
3. 버튼 사용:
   - 헤더 확인: 루트/DTD/선두 프리뷰 표시
- 첫 safetyreport 추출: 첫 리포트 블록을 들여쓰기/트리로 표시
- 좌우 네비게이션 버튼으로 safetyreport 간 이동(가운데에서 현재/전체 개수 표시)
   - 태그 빈도 스캔(샘플): 앞부분 NMB 범위에서 태그 카운트
   - 태그 빈도 스캔(전체): 파일 전체 태그 카운트(시간 소요)
4. 옵션: 샘플 스캔 크기(MB), 청크 크기(KB) 조절로 성능/정확도 균형

## 시각화
- Tag Counts: 상위 20개 태그 막대 표시 + 표기(raw)
- safetyreport Tree: 반복 구조를 태그/개수로 요약

## 참고/제약
- 매우 큰 XML은 전체 파싱 대신 청크 스캔을 권장합니다.
- DOMParser는 작은 조각(예: safetyreport)에만 사용합니다.
- 로컬 파일 보안 정책상 파일 선택/드롭만 지원합니다(경로 직접 접근 불가).

## 파일 목록
- `index.html` UI 스캐폴드
- `styles.css` 다크 테마 스타일
- `app.js` 청크 기반 스캔/추출/시각화 로직
