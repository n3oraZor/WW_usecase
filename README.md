# Ticket Dashboard

Ticket Dashboard is a React/JavaScript frontend application that retrieves support ticket data from [this API](https://weward-sas.github.io/hiring-cs-ai/api_fake_tickets.json) and leverages the OpenAI ChatGPT (gpt-3.5-turbo) language model to analyze, categorize, and prioritize the tickets based on urgency and complexity. It also offers an automated answer generation approach using a local knowledge base (FAQ).

## Features

- **Ticket Retrieval:** Fetch support ticket data from a remote API.
- **Ticket Analysis:** Use OpenAI ChatGPT to analyze ticket messages and categorize them by theme.
- **Prioritization & Sorting:** Automatically sort and prioritize tickets based on urgency, complexity, or custom criteria.
- **Automated Response:** Generate tailored responses based on a local FAQ (faq.json) and pre-defined prompts.
- **Interactive UI:** Clickable table headers to sort tickets and interactive cells to manually trigger response generation.

## Installation

1. **Clone the Repository:**

Install Dependencies:
npm install
npm install cross-env --save-dev
Start the Development Server:
npm start
