import "dotenv/config";
import autocannon from "autocannon";

const baseUrl = `http://${process.env.HOST}:${process.env.PORT}`;

const instance = autocannon(
  {
    url: `${baseUrl}/`,
    method: "GET",
    headers: {
      Accept: "text/html",
    },
    connections: 50,
    duration: 10,
  },
  console.error
);

autocannon.track(instance, { renderProgressBar: true });
