---
title: 'A CPP Calculator'
date: '2026-11-07'
description: 'Estimate your Canada Pension Plan retirement pension from your birth year, salary, working years, and the age you start it.'
---

<script>
  import CppCalculator from '$lib/components/CppCalculator.svelte'
</script>

Your Canada Pension Plan pension is 25% of your career-average earnings plus two top-ups introduced in 2019 and 2024, adjusted up or down for the age you start it.

<CppCalculator />

## What it assumes

- **A steady salary**, the same in today's dollars from the age you start working to the age you stop. Raises and promotions are not modelled.
- **Today's dollars**, with the earnings ceilings published through 2026 and projected after that at the wage-growth rate you enter.
- **CPP only.** No OAS, survivor's pension, disability, or post-retirement benefits, and no check that you qualify. Quebec Pension Plan rules differ.
- **Child-rearing years** are optional; they apply the provision to the base component, and you have to apply for it separately in real life.

It runs entirely in your browser and remembers your inputs on this device. Your [statement of contributions](https://www.canada.ca/en/services/benefits/publicpensions/cpp.html) is the authoritative record, and this is an estimate, not advice.
