import ApolloClient from "apollo-boost";

export const fetchAPI = (userId: any) => {

  // LIVE
  // const uri = "https://api.cuesapp.co/";
  // DEV
  const uri = "http://localhost:8081/";
  return new ApolloClient({
    uri,
    headers: {
      userId
    }
  });
};
