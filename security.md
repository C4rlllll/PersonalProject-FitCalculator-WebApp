# Security Policy

FitCalc is a small student/open-source utility project. It does not collect
personal data, does not use authentication, and does not persist any data
server-side — all storage is local to the user's browser.

## Scope

Given the minimal nature of this project (no accounts, no database, no
sensitive data handling), the main things worth reporting are:

- Ways the local Java server could be tricked into unexpected behavior via
  malformed requests
- Any accidental inclusion of tracking/analytics code
- Any accidental collection or transmission of personal data

## Reporting a vulnerability

If you find an issue, please open an issue on the project's GitHub
repository describing the problem and how to reproduce it.

## Out of scope

- This project is not intended for production/commercial deployment as-is.
- It does not implement authentication, rate limiting, or HTTPS — running
  it as a public-facing service without adding those is not recommended.