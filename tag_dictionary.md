# Tag Dictionary (요약)

태그 | 의미(요약) | 예시 | 코드/체계
--- | --- | --- | ---
ichicsr | ICSR 루트 | `<ichicsr>` | ICH ICSR
ichicsrmessageheader | 메시지 헤더 | `messagedateformat=204` | ICH ICSR
messagetype | 메시지 유형 | `ichicsr` | -
messageformatversion/release | 포맷 버전/릴리스 | `2.1`/`1.0` | ICH ICSR
messagedate(format) | 메시지 일시 | `204`/`20250717084352` | Date codes(102/203/204)
messagesender/receiveridentifier | 발신/수신 식별자 | `FDA CDER`/`Public Use` | -
safetyreport | 개별 보고 블록 | `<safetyreport>` | ICH ICSR
safetyreportid/version | 보고 ID/버전 | `25135630`/`1` | -
reporttype | 보고 유형 | `1` | Report Type
primarysourcecountry | 원보고 국가 | `US` | ISO 3166-1 alpha-2
receivedate(format) | 수신일자(초기) | `102`/`20250328` | Date codes
receiptdate(format) | 수신일자(현재) | `102`/`20250328` | Date codes
transmissiondate(format) | 전송일시 | `102/204` | Date codes
serious | 중대성 여부 | `1` | Seriousness Flags
seriousnessdeath/... | 세부 중대성 | `2` 등 | Seriousness Flags
primarysource | 원보고자 블록 | `<primarysource>` | -
qualification | 보고자 자격 | `5` | Qualification
sender/receiver | 발신/수신 블록 | `<sender>` | -
patient | 환자 블록 | `<patient>` | -
patientsex | 성별 | `1` | Patient Sex
patientweight | 체중 | `61.65` | -
reaction | 이상반응 | `<reaction>` | MedDRA
reactionmeddrapt | MedDRA PT | `Influenza` | MedDRA
reactionmeddraversionpt | MedDRA 버전 | `28.0` | MedDRA
reactionoutcome | 반응 결과 | 코드값 | Reaction Outcome
drug | 투여 약물 | `<drug>` | -
drugcharacterization | 약물 역할 | `1` | ICSR R2 (role)
medicinalproduct | 제품명 | `TADALAFIL` | -
activesubstance/name | 유효성분/명칭 | `TREPROSTINIL` | -
drugadministrationroute | 투여경로 | `048` | Route codes
drugdosageform | 제형 | 코드값 | EDQM/ICSR
drugdosagetext | 용량 텍스트 | `40 MG DAILY ORAL` | -
drugstructuredosagenumb/unit | 구조적 용량 수치/단위 | `40`/`003` | Unit codes
drugseparatedosagenumb | 1회 용량 | `1` | -
drugintervaldosageunitnumb | 간격 수치 | `1` | -
drugintervaldosagedefinition | 간격 정의 | `804` | Dose Interval Def.
drugtreatmentduration/unit | 투여 기간 | 코드값 | ICSR R2
drugstartdate(format)/drugstartdate | 시작일 | `102`/`20220610` | Date codes
drugenddate(format)/drugenddate | 종료일 | 코드/값 | Date codes
drugbatchnumb | 제조번호 | `...` | -
drugauthorizationnumb | 허가번호 | `...` | -
actiondrug | 약물 조치 | 코드값 | ICSR R2
occurcountry | 사건 발생국 | `US` | ISO 3166-1
literaturereference | 문헌 참고 | 텍스트 | -
narrativeincludeclinical/summary | 임상 서술/요약 | 텍스트 | -
duplicate/... | 중복 보고 관련 | 코드/값 | -

authoritynumb | 규제기관 참조번호 | `746694` | -
companynumb | 회사(제조사/MAH) 참조번호 | 값 | -
duplicate | 중복보고 플래그/블록 | 값 | -
duplicatenumb | 중복 참조번호 | 값 | -
duplicatesource | 중복 출처 | 값 | -
reportduplicate | 중복 보고 세부 | 블록 | -

patientagegroup | 연령군 코드 | 값 | ICSR R2
patientonsetage/unit | 발병 연령/단위 | 값 | ICSR R2

drugadditional | 추가 약물 정보 | 값 | -
drugcumulativedosagenumb/unit | 누적 용량 수치/단위 | 값 | ICSR R2
drugrecuraction | 재투여 시 조치 | 코드 | ICSR R2
drugrecuractionmeddraversion | 재투여 관련 MedDRA 버전 | `28.0` 등 | MedDRA
drugrecurreadministration | 재투여 여부 | 코드 | ICSR R2
drugrecurrence | 반응 재발 여부 | 코드 | ICSR R2
drugindication | 적응증 | `Pulmonary arterial hypertension` | -

세부 코드 표는 `Codex/codes/` 디렉터리를 참고하세요.
