# FAERS ICH-ICSR 태그 검토(tag_review)

본 문서는 `XML/1_ADR25Q2.xml`에서 수집된 태그(총 88개)의 의학/약물감시 맥락 의미를 ICH ICSR(E2B(R2)) 표준과 FAERS 관례에 근거해 요약한 것입니다. 값의 상세 코드 체계는 배포 문서(ICH 코드 리스트, MedDRA, 날짜 포맷 규칙 등)를 참고하세요.

## ICSR 루트/헤더
- `ichicsr`: ICSR 루트 요소
- `ichicsrmessageheader`: 메시지 헤더 컨테이너
- `messagetype`: 메시지 유형(예: ichicsr)
- `messageformatversion`/`messageformatrelease`: ICSR 포맷 버전/릴리스(예: 2.1/1.0)
- `messagenumb`: 메시지 일련/배치 식별자
- `messagesenderidentifier`/`messagereceiveridentifier`: 발신/수신 식별자(기관/조직명)
- `messagedateformat`/`messagedate`: 메시지 생성 일시(예: 204=YYYYMMDDHHMMSS)

## 보고서 본문(safetyreport)
- `safetyreport`: 개별 이상사례 보고 컨테이너(반복)
- `safetyreportversion`: 보고서 버전
- `safetyreportid`: 보고서 고유 ID
- `reporttype`: 보고 유형(예: 1=자발 보고 등, 코드)
- `primarysourcecountry`: 최초 보고자/원보고 국가
- `transmissiondateformat`/`transmissiondate`: 보고 전송 일시(코드/값)
- `receivedateformat`/`receivedate`: 수신 일자(초기 수신)
- `receiptdateformat`/`receiptdate`: 수신 일자(현재 수신/가공 후)
- `fulfillexpeditecriteria`: 신속보고 요건 충족 여부(코드)
- `authoritynumb`: 규제기관(Authority) 부여 번호
- `companynumb`: 제조사/MAH 부여 번호
- `duplicate`/`duplicatenumb`/`duplicatesource`: 중복 보고 지시 및 원천

### 심각도/중요성
- `serious`: 중대한 이상사례 여부(코드)
- `seriousnessdeath`: 사망 관련성(코드)
- `seriousnesslifethreatening`: 생명위협(코드)
- `seriousnesshospitalization`: 입원/입원연장(코드)
- `seriousnessdisabling`: 장애/무능(코드)
- `seriousnesscongenitalanomali`: 선천성기형(코드)
- `seriousnessother`: 기타 중대성(코드)

### 발신/수신/원보고자
- `primarysource`: 원보고자 정보 컨테이너
- `reportercountry`: 보고자 국가
- `qualification`: 보고자 자격(의사/약사/소비자 등, 코드)
- `sender`/`sendertype`/`senderorganization`: 발신 주체, 유형(제조사/기관 등), 조직명
- `receiver`/`receivertype`/`receiverorganization`: 수신 주체, 유형(규제기관/센터 등), 조직명

## 환자(patient)
- `patient`: 환자 정보 컨테이너
- `patientsex`: 성별(코드)
- `patientweight`: 체중(일반적으로 kg)
- `patientonsetage`/`patientonsetageunit`: 발병 시 연령 및 단위(코드)
- `patientagegroup`: 연령군(코드)
- `occurcountry`: 사건 발생 국가
- `narrativeincludeclinical`/`summary`: 임상 서술/요약(자유 기술)
- `literaturereference`: 문헌 참고

### 이상반응(reaction)
- `reaction`: 이상반응 이벤트 컨테이너(반복)
- `reactionmeddrapt`: MedDRA 선호용어(PT)
- `reactionmeddraversionpt`: 사용된 MedDRA 버전
- `reactionoutcome`: 결과(회복/미회복/사망 등, 코드)

## 약물(drug)
- `drug`: 투여 약물 컨테이너(반복)
- `drugcharacterization`: 약물 역할(1=의심, 2=병용, 3=상호작용; 코드)
- `medicinalproduct`: 제품명(보고된 의약품명)
- `activesubstance`/`activesubstancename`: 유효성분 컨테이너/명칭
- `drugdosageform`: 제형(코드/용어)
- `drugadministrationroute`: 투여경로(코드, 예: 048=경구)
- `drugdosagetext`: 용량 표현(자유 기술)
- `drugstructuredosagenumb`/`drugstructuredosageunit`: 구조적 용량 수치/단위(코드)
- `drugseparatedosagenumb`: 1회 투여량 수치
- `drugcumulativedosagenumb`/`drugcumulativedosageunit`: 누적 용량 수치/단위(코드)
- `drugintervaldosageunitnumb`/`drugintervaldosagedefinition`: 투여 간격 수치/정의(코드; 예: 804=매일)
- `drugtreatmentduration`/`drugtreatmentdurationunit`: 치료 기간 수치/단위(코드)
- `drugstartdateformat`/`drugstartdate`: 치료 시작일(코드/값)
- `drugenddateformat`/`drugenddate`: 치료 종료일(코드/값)
- `drugbatchnumb`: 제조번호/로트번호
- `drugauthorizationnumb`: 허가/제품 승인 번호
- `actiondrug`: 약물에 취한 조치(중단/감량/변경 등, 코드)

### 재투여/재발 관련(Rechallenge)
- `drugrecurrence`: 반응 재발 여부(코드)
- `drugrecurreadministration`: 재투여(재복용) 여부(코드)
- `drugrecuraction`: 재투여 시 조치(코드)
- `drugrecuractionmeddraversion`: 관련 MedDRA 버전 지정

## 기타/메타
- `primarysourcecountry`: 원보고 국가(상위에 별도 표기되는 경우)
- `reportduplicate`: 중복 보고 블록

참고
- 날짜 형식 코드는 ICH(E2B R2) 표준값(예: 102=YYYYMMDD, 204=YYYYMMDDHHMMSS)을 사용합니다.
- MedDRA 관련 태그는 동일 버전의 용어/코드 일관성을 유지해야 합니다.
- 많은 필드가 ‘코드 리스트’를 사용하므로, 해석 시 코드표(FAERS/ICH 배포 문서)를 반드시 대조하십시오.
