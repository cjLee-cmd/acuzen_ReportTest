# Example Snippets

다음 파일들은 `XML/1_ADR25Q2.xml`에서 태그별 예시 라인을 최대 10개까지 샘플링한 것입니다.

- `reporttype.txt`, `serious.txt`, `seriousnesshospitalization.txt`, `patientsex.txt`
- `reactionmeddrapt.txt`, `reactionoutcome.txt`
- `medicinalproduct.txt`, `drugadministrationroute.txt`
- `drugintervaldosagedefinition.txt`, `drugstructuredosageunit.txt`

직접 추가 샘플을 추출하려면(터미널):

```
rg -n "<TAG>[^<]+" XML/1_ADR25Q2.xml | head -n 20
```

예:
```
rg -n "<qualification>[^<]+" XML/1_ADR25Q2.xml | head -n 20
```
