export default {
  mode: "development",
  name: "Kaa DEVELOPMENT",
  debug: false,

  domain: "",
  frontendUrl: "http://localhost:3000",
  backendUrl: "http://localhost:5000",
  backendAuthUrl: "http://localhost:5000/api/v1/auth",
  tusUrl: "http://localhost:5100",

  maintenance: false,
  port: 3000,
  host: "localhost",
  database: {
    url: "mongodb://localhost:27017/kaa-saas-db",
  },
};
