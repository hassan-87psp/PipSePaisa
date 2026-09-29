PipSePaisa V210 — Month-specific Staff Salary

1) Run 84_FINANCE_MONTHLY_SALARY_V210.sql in Supabase SQL Editor.
2) Upload/replace the patch files.
3) Finance & Accounts > Staff & Salary:
   - Staff Profile keeps name/role/email/due day/payout details only.
   - Select a month from the Finance month picker.
   - Click Prepare / Add Missing Staff if needed.
   - Click Edit Salary on each staff row and enter that month’s Base Salary, Bonus, Deduction and Advance.
   - Payable calculates automatically.
   - Paid salary rows are locked; later corrections should use an Adjustment transaction.

Important:
- Salary can be different every month.
- Editing September never changes August or October.
- Existing historical finance_salary_runs are preserved.
- The SQL only clears old fixed/default salary values from Staff Profiles so new monthly rows start at 0.
