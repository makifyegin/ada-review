## Code Review

Code review of `createStudents.js` for the Raspberry Pi Foundation

## The review

The review document is in [`review.md`](./review.md) at the project root. It covers:

- **Overview** — top-level assessment of the file
- **Strengths** — what the original author did well
- **Tools used** — disclosure of tools (including AI assistance)
- **Issues** — 12 sections covering bugs, scaling concerns, and refactor suggestions, following the brief's Analyse / Problems / Improvements / Feedback structure

## Supporting code

To ground the review in real testing, I built a parallel Express/Sequelize/Postgres project that hits the same problems the reviewed file solves. The relevant parts:

- `controllers/createStudents.js` — my own implementation of the endpoint, incorporating the fixes proposed in the review
- `controllers/formatValidationErrors.js` — error formatting helper
- `controllers/reportError.js` — error reporting helper
- `models/student.js`, `models/school.js` — Sequelize models with validators and a composite unique index
- `script/batch-test.js` — 10-scenario test runner that exercises the endpoint
- `test-results.txt` — captured output from the test runner

## Running locally

Requires Node 22+, Docker, and a `.env` file based on `.env.example`.

```bash
docker-compose up -d        # start Postgres
npm install
npm run dev                 # starts the server
node script/batch-test.js   # runs the test suite
```

## Tools and process

See the **Tools used** section of [`review.md`](./review.md#tools-used) for full disclosure, including AI assistance throughout pair-programming and review drafting.
