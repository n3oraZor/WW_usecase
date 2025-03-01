import React, { useState, useEffect, useCallback, memo } from "react";
import "./App.css";
import { prompt1, prompt2, prompt3, prompt4 } from "./Baseprompt";
import faq from "./faq.json"; // Import de la FAQ locale

// Clé API (.env)
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

// Messages système par champ
const SYSTEM_MESSAGES = {
  analysis:
    "Tu es un expert en relation client. Propose une catégorie pour segmenter la demande en te basant sur la FAQ.",
  priority:
    "Tu es un expert en relation client. Définis le niveau de priorité sur une échelle de 1 à 3, en te référant à la FAQ.",
  response:
    "Tu es un expert en relation client. Rédige une réponse chaleureuse et bienveillante à adresser au client en t'appuyant sur la FAQ.",
  language:
    "Tu es un expert en relation client. Détermine la langue du message et renvoie la réponse au format exact (ex: Francais (FR) - 🇫🇷).",
};

// Appel API OpenAI avec gestion simplifiée des erreurs
const callOpenAi = async (ticket, promptFunc, field, transform = (x) => x) => {
  const prompt =
    field === "language"
      ? promptFunc(ticket.message)
      : promptFunc(ticket.message, faq); // faq importé depuis faq.json
  const requestBody = {
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: SYSTEM_MESSAGES[field] },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
  };
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  });
  if (!response.ok) {
    const errorText = await response.text();
    let errorObj;
    try {
      errorObj = JSON.parse(errorText);
    } catch (e) {
      throw new Error(`Erreur API OpenAI (${field}) : ${errorText}`);
    }
    // Gestion des erreurs rate_limit_exceeded
    if (errorObj.error && errorObj.error.code === "rate_limit_exceeded") {
      throw new Error("GPT limitation reached with the current plan");
    }
    // Gestion des erreurs insufficient_funds
    if (errorObj.error && errorObj.error.code === "insufficient_quota") {
      throw new Error("Not enough fund, prepaid account empty");
    }
    throw new Error(`Error API OpenAI (${field}) : ${errorText}`);
  }
  const result = await response.json();
  if (!result.choices || result.choices.length === 0)
    throw new Error(`Aucune réponse pour ${field}`);
  let output = result.choices[0].message?.content?.trim();
  if (!output) throw new Error(`Aucune sortie pour ${field}`);
  return transform(output);
};

// Hook pour les appels API liés aux tickets
const useTicketApi = (setProcessedTickets) => {
  const analyzeTicket = useCallback(
    async (ticket) => {
      try {
        const analysis = await callOpenAi(ticket, prompt1, "analysis");
        setProcessedTickets((prev) =>
          prev.map((t) => (t.id === ticket.id ? { ...t, analysis } : t))
        );
      } catch (err) {
        setProcessedTickets((prev) =>
          prev.map((t) =>
            t.id === ticket.id
              ? { ...t, analysis: "Erreur: " + err.message }
              : t
          )
        );
      }
    },
    [setProcessedTickets]
  );

  const determinePriority = useCallback(
    async (ticket) => {
      try {
        const priority = await callOpenAi(ticket, prompt2, "priority", (s) => {
          const match = s.match(/[1-3]/);
          return match ? match[0] : s;
        });
        setProcessedTickets((prev) =>
          prev.map((t) => (t.id === ticket.id ? { ...t, priority } : t))
        );
      } catch (err) {
        setProcessedTickets((prev) =>
          prev.map((t) =>
            t.id === ticket.id
              ? { ...t, priority: "Erreur: " + err.message }
              : t
          )
        );
      }
    },
    [setProcessedTickets]
  );

  const proposeResponse = useCallback(
    async (ticket) => {
      try {
        const responseText = await callOpenAi(ticket, prompt3, "response");
        setProcessedTickets((prev) =>
          prev.map((t) =>
            t.id === ticket.id ? { ...t, response: responseText } : t
          )
        );
      } catch (err) {
        setProcessedTickets((prev) =>
          prev.map((t) =>
            t.id === ticket.id
              ? { ...t, response: "Erreur: " + err.message }
              : t
          )
        );
      }
    },
    [setProcessedTickets]
  );

  const determineLanguage = useCallback(
    async (ticket) => {
      try {
        const language = await callOpenAi(ticket, prompt4, "language");
        setProcessedTickets((prev) =>
          prev.map((t) => (t.id === ticket.id ? { ...t, language } : t))
        );
      } catch (err) {
        setProcessedTickets((prev) =>
          prev.map((t) =>
            t.id === ticket.id
              ? { ...t, language: "Erreur: " + err.message }
              : t
          )
        );
      }
    },
    [setProcessedTickets]
  );

  return {
    analyzeTicket,
    determinePriority,
    proposeResponse,
    determineLanguage,
  };
};

// Composant Spinner
const Spinner = () => <div className="spinner" />;

// Composant memo pour une ligne de ticket
const TicketRow = memo(({ ticket, onGenerateResponse }) => (
  <tr className="ticket-row">
    <td>{ticket.id}</td>
    <td>{ticket.message}</td>
    <td>{ticket.language || <Spinner />}</td>
    <td>{ticket.analysis || <Spinner />}</td>
    <td>{ticket.priority || <Spinner />}</td>
    <td
      onClick={() => onGenerateResponse(ticket)}
      style={{ cursor: "pointer" }}
      title="Cliquez pour générer la réponse"
    >
      {ticket.response || (
        <span style={{ color: "blue", textDecoration: "underline" }}>
          Cliquez pour générer la réponse
        </span>
      )}
    </td>
  </tr>
));

function App() {
  const [allTickets, setAllTickets] = useState([]);
  const [processedTickets, setProcessedTickets] = useState([]);
  const [batchIndex, setBatchIndex] = useState(0);
  const [sortColumn, setSortColumn] = useState("id"); // "id", "priority" ou "analysis"
  const [sortOrder, setSortOrder] = useState("desc"); // "asc" ou "desc"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Récupération des fonctions API via le hook personnalisé
  const {
    analyzeTicket,
    determinePriority,
    proposeResponse,
    determineLanguage,
  } = useTicketApi(setProcessedTickets);

  // Récupération des tickets JSON en ligne
  const fetchTickets = async () => {
    try {
      const response = await fetch(
        "https://weward-sas.github.io/hiring-cs-ai/api_fake_tickets.json"
      );
      if (!response.ok)
        throw new Error("Erreur lors du chargement des tickets");
      const data = await response.json();
      setAllTickets(data);
      setLoading(false);
      processBatch(0, data);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setLoading(false);
    }
  };

  // On lance fetchTickets
  useEffect(() => {
    fetchTickets();
  }, []);

  // Fonction de tri
  const sortTicketsFn = (tickets, column, order) =>
    tickets.sort((a, b) => {
      if (column === "id") return order === "asc" ? a.id - b.id : b.id - a.id;
      if (column === "priority") {
        const aVal = parseInt(a.priority) || 999,
          bVal = parseInt(b.priority) || 999;
        return order === "asc" ? aVal - bVal : bVal - aVal;
      }
      if (column === "analysis") {
        const aVal = (a.analysis || "").toLowerCase(),
          bVal = (b.analysis || "").toLowerCase();
        return aVal === bVal
          ? 0
          : order === "asc"
          ? aVal < bVal
            ? -1
            : 1
          : aVal < bVal
          ? 1
          : -1;
      }
      return 0;
    });

  // Traitement d'un lot de 5 tickets (pour réduire conso TOKEN en test)
  const processBatch = (startIndex, tickets = allTickets) => {
    const batch = tickets.slice(startIndex, startIndex + 5).map((ticket) => ({
      ...ticket,
      language: "",
      analysis: "",
      priority: "",
      response: "",
    }));
    const sorted = sortTicketsFn([...batch], sortColumn, sortOrder);
    setProcessedTickets(sorted);
    sorted.forEach((ticket) => {
      analyzeTicket(ticket);
      determinePriority(ticket);
      determineLanguage(ticket);
    });
  };

  // Passage au lot de 5 suivant
  const handleNext = () => {
    const newIndex = batchIndex + 5;
    if (newIndex < allTickets.length) {
      setBatchIndex(newIndex);
      processBatch(newIndex);
    }
  };

  // Tri au clic sur l'entête
  const handleSortByColumn = (column) => {
    const newOrder =
      sortColumn === column ? (sortOrder === "asc" ? "desc" : "asc") : "asc";
    setSortColumn(column);
    setSortOrder(newOrder);
    setProcessedTickets(sortTicketsFn([...processedTickets], column, newOrder));
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div className="App">
      <h1>MODERATION TOOL</h1>
      <table>
        <thead>
          <tr>
            <th
              onClick={() => handleSortByColumn("id")}
              style={{ cursor: "pointer" }}
            >
              ID zendesk{" "}
              {sortColumn === "id" && (sortOrder === "asc" ? "▲" : "▼")}
            </th>
            <th>Message</th>
            <th>Language</th>
            <th
              onClick={() => handleSortByColumn("analysis")}
              style={{ cursor: "pointer" }}
            >
              Category{" "}
              {sortColumn === "analysis" && (sortOrder === "asc" ? "▲" : "▼")}
            </th>
            <th
              onClick={() => handleSortByColumn("priority")}
              style={{ cursor: "pointer" }}
            >
              Priority{" "}
              {sortColumn === "priority" && (sortOrder === "asc" ? "▲" : "▼")}
            </th>
            <th>Proposed answer</th>
          </tr>
        </thead>
        <tbody>
          {processedTickets.map((ticket) => (
            <TicketRow
              key={ticket.id}
              ticket={ticket}
              onGenerateResponse={proposeResponse}
            />
          ))}
        </tbody>
      </table>
      <div className="controls">
        <button onClick={handleNext}>NEXT</button>
      </div>
    </div>
  );
}

export default App;
