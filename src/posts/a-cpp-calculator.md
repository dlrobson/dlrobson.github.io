---
title: 'A CPP and OAS Calculator'
date: '2026-11-07'
description: 'Estimate your Canada Pension Plan retirement pension and Old Age Security from your birth year, earning periods, residency, and the age you start them.'
---

<script>
  import RetirementCalculator from '$lib/components/RetirementCalculator.svelte'
</script>

Your Canada Pension Plan pension is 25% of your career-average earnings plus two top-ups introduced in 2019 and 2024, adjusted up or down for the age you start it. Old Age Security is a separate monthly payment based on how long you have lived in Canada after 18, and it grows if you start it after 65.

<RetirementCalculator />

## What it assumes

- **Earning periods**, each a salary in today's dollars over a range of ages. Earning periods cannot overlap; a gap between them is time with no earnings, and raises within a period are not modelled.
- **Today's dollars**, with the CPP earnings ceilings and the OAS maximum published for the fourth quarter of 2026. The CPP ceilings are projected after 2026 at the wage-growth rate you enter.
- **CPP and OAS.** No survivor's pension, disability, post-retirement benefits, Guaranteed Income Supplement, or OAS recovery tax, and no check that you qualify for either. Quebec Pension Plan rules differ.
- **OAS residency**, at 1/40 of the full pension for each year of Canadian residence after 18 that you enter, up to 40 years. The 10-year minimum is not checked.
- **OAS start age** can be 65 to 70, with 0.6% more for each month after 65. The 10% increase at 75 is not modelled.
- **Before tax.** Both pensions are shown gross, before income tax and the OAS recovery tax.
- **Child-rearing years** are optional for CPP; they apply the provision to the base component, and you have to apply for it separately in real life.

It runs entirely in your browser and remembers your inputs on this device. Your [Canada Pension Plan statement of contributions](https://www.canada.ca/en/services/benefits/publicpensions/cpp.html) is the authoritative CPP record, and Service Canada's residence history is the authoritative OAS record. This is an estimate, not advice.
