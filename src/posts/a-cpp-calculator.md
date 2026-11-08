---
title: 'A CPP Calculator'
date: '2026-11-07'
description: 'Estimate your Canada Pension Plan retirement pension from your birth year, salary, working years, and the age you start it.'
---

<script>
  import CppCalculator from '$lib/components/CppCalculator.svelte'
</script>

The Canada Pension Plan retirement pension is three pieces added together: a base amount worth 25% of your career-average pensionable earnings, plus two enhanced pieces introduced in 2019 and 2024. The age you start it adjusts the total &mdash; 0.6% less for each month before 65, and 0.7% more for each month after.

This calculator applies those rules to a steady salary. Change the age you start CPP, the growth assumptions, or the child-rearing years and the amount updates; open the chart to compare every start age from 60 to 70.

Open **Total received by age** under the estimate to see the total collected by any age from 60 to 95, in today's dollars, for each start age. Because the figures are already normalised to today's dollars, each start age's monthly amount is flat in real terms and its total grows as a straight line from the age it begins. The chart assumes the money is spent as it arrives, not invested, so a later start only comes out ahead once its larger payments have made up for the years it went without.

<CppCalculator />

## What it assumes

- **A steady salary.** You earn the same amount, in today's purchasing power, from the age you started working to the age you stop. Raises and promotions are not modelled; time off is handled by the optional child-rearing entries.
- **Published ceilings.** The calculator uses the published YMPE and YAMPE amounts; later years grow at the wage-growth rate. Amounts are deflated to today's dollars at the inflation rate.
- **The 2019&ndash;2022 contribution ramp.** A 2019 contribution buys a quarter of a full year's enhanced credit, 2020 half, 2021 three-quarters, and 2022 onward all of it. The model applies those shares rather than crediting every enhanced year equally.
- **CPP, not QPP.** If you contributed to the Quebec Pension Plan, the rules and amounts are different.
- **Eligibility is not checked.** The estimate assumes you qualify for a retirement pension. It does not test residency or the minimum contribution requirement.
- **CPP only.** OAS, the survivor's pension, disability, and post-retirement benefits are separate and not included.
- **Child-rearing years are optional.** Add the years you were off to raise a child under seven; new periods start at age 30 and last five years, and you can edit them or add more. The estimate assumes no earnings during those years and applies the child-rearing provision. You have to apply for the provision in real life, and it only affects the base component.

Wage growth moves the earnings ceiling after the last published year. Inflation moves your salary in nominal terms and converts the result back to today's dollars. When the two rates are equal, the ceiling is flat in real terms.

It runs entirely in your browser: nothing you type is sent anywhere, and your inputs are remembered on this device.

## How the estimate works

The base piece averages your pensionable earnings over your contributory period, drops the lowest 17% of months, and pays 25% of that average, to a limit set by the five-year average of the earnings ceiling. Months after 65 are removed before that drop-out, so deferring does not dilute the average it is about to multiply.

If you enter child-rearing years, eligible months in those windows are removed before the 17% drop-out, subject to the same 120-month floor. Overlapping windows are counted once. The enhanced components ignore the provision.

The two enhanced pieces work differently. They are always divided by 480 months, with no general drop-out. Someone with 20 years of enhanced contributions therefore receives half of the enhanced amount, not the full top-up. The second piece applies only to earnings between the first and second ceilings.

As a check on the arithmetic, the model reproduces the published maximum pension for a full career at the ceiling to within a dollar.

Your [statement of contributions](https://www.canada.ca/en/services/benefits/publicpensions/cpp.html) is the authoritative record, and this estimate is not financial advice.
