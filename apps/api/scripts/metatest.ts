import "dotenv/config";
import autocannon from "autocannon";

const baseUrl = `http://${process.env.HOST}:${process.env.PORT}`;

const instance = autocannon(
  {
    url: `${baseUrl}/meta/health`,
    method: "GET",
    headers: {
      Accept: "text/html",
    },
    workers: 1,
    connections: 1000,
    duration: 10,
  },
  console.error
);

autocannon.track(instance, { renderProgressBar: true });
