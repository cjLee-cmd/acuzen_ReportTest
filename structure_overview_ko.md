# FAERS XML 구조 요약 (1_ADR25Q2.xml 샘플 기반)

- 루트 요소: `ichicsr` (DTD: `ich-icsr-v2.1.dtd`)
- 상위 섹션:
  - `ichicsrmessageheader`: `messagetype`, `messageformatversion`, `messageformatrelease`, `messagenumb`, `messagesenderidentifier`, `messagereceiveridentifier`, `messagedateformat`, `messagedate`
  - `safetyreport` (반복): 개별 이상사례 리포트 단위

## safetyreport 주요 필드(샘플 관찰)
- 메타: `safetyreportversion`, `safetyreportid`, `primarysourcecountry`, `transmissiondateformat`, `transmissiondate`, `reporttype`
- 심각도: `serious`, `seriousnessdeath`, `seriousnesslifethreatening`, `seriousnesshospitalization`, `seriousnessdisabling`, `seriousnesscongenitalanomali`, `seriousnessother`
- 수신일자: `receivedateformat`, `receivedate`, `receiptdateformat`, `receiptdate`
- 기타: `fulfillexpeditecriteria`, `authoritynumb`
- `primarysource`: `reportercountry`, `qualification`
- `sender`: `sendertype`, `senderorganization`
- `receiver`: `receivertype`, `receiverorganization`
- `patient`:
  - 인구/일반: `patientweight`, `patientsex`
  - `reaction` (반복): `reactionmeddraversionpt`, `reactionmeddrapt`
  - `drug` (반복):
    - 기본: `drugcharacterization`, `medicinalproduct`
    - 용량/투여: `drugstructuredosagenumb`, `drugstructuredosageunit`, `drugseparatedosagenumb`, `drugintervaldosageunitnumb`, `drugintervaldosagedefinition`, `drugdosagetext`, `drugadministrationroute`, `drugdosageform`
    - 적응증: `drugindication`
    - 기간: `drugstartdateformat`, `drugstartdate` (등)
    - 유효성분: `activesubstance` → `activesubstancename`

## 태그 출현 샘플(상위)
- 샘플 2,000 태그 토큰 기준 상위: `drug`, `medicinalproduct`, `drugcharacterization`, `activesubstance`, `reaction`, `reactionmeddrapt`, `safetyreport`, `sender`, `receiver`, `primarysource` 등.
- 상세 수치는 `Codex/tag_sample_counts.txt` 참조.

## 산출물
- `Codex/header_sample.txt`: 헤더·루트 및 선두 부분 200라인
- `Codex/sample_safetyreport.xml`: 첫 번째 `safetyreport` 블록 스니펫
- `Codex/tag_sample_counts.txt`: 앞부분 2,000개 태그 토큰 기반 빈도 샘플

참고: 본 요약은 전체 파일의 일부(샘플)에 근거합니다. 전체 구조는 ICH ICSR(E2B v2.1) 스키마를 따른 동일한 패턴의 반복으로 구성됩니다.
