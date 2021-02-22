import ApolloClient from 'apollo-boost';

export const fetchAPI = (userId: any) => {

    const uri = 'http://trackcovid-env.eba-9srgt228.us-east-1.elasticbeanstalk.com:8081/'
    // const uri = 'http://192.168.1.107:8081/'

    return new ApolloClient({
        uri,
        headers: {
            userId
        }
    });
    
}