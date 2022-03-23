// REACT
import React, { useCallback, useState } from 'react';
import { Image, ActivityIndicator } from 'react-native';
import _ from 'lodash';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

// API
import { fetchAPI } from '../graphql/FetchAPI';
import { retrievePDFFromArchive } from '../graphql/QueriesAndMutations';

// COMPONENTS
import { Text, TouchableOpacity, View } from './Themed';
import { TextInput } from './CustomTextInput';
import alert from './Alert';
import { Popup } from '@mobiscroll/react5';
import '@mobiscroll/react/dist/css/mobiscroll.react.min.css';

const Books: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [searchComplete, setSearchComplete] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [selectedBook, setSelectedBook] = useState<any>(null);
    const [retrievingBook, setRetrievingBook] = useState<any>('');

    // HOOKS

    /**
     * @description Fetches results for Search term
     */
    const handleSearch = useCallback(() => {
        if (!searchTerm || searchTerm === '') {
            alert('Enter search input.');
            return;
        }
        // make request here...
        (async () => {
            setLoading(true);
            setSearchComplete(false);
            const url =
                'https://archive.org/services/search/v1/scrape?fields=title,identifier,mediatype,format,description,downloads,collection&q=';
            const response = await axios.get(
                url +
                    encodeURIComponent(searchTerm) +
                    '&sorts=' +
                    encodeURIComponent('downloads desc') +
                    '&count=1000&and[]=lending___status%3A"is_readable"'
            );
            const items = response.data.items;
            const filteredItems = items.filter((item: any) => {
                if (item.mediatype !== 'texts') {
                    return false;
                }
                let pdfExists = false;
                try {
                    pdfExists =
                        item.format &&
                        item.format.length > 0 &&
                        item.format.find((i: any) => {
                            return i === 'Text PDF';
                        });
                } catch (e) {
                    console.log(item.format);
                }

                let isAvailableForFree = false;

                if (item.collection && (item.collection.includes('opensource') || item.collection.includes('community'))) {
                    isAvailableForFree = true;
                }

                return pdfExists && isAvailableForFree;
            });
            setResults(filteredItems);
            setSearchComplete(true);
            setLoading(false);
        })();
    }, [searchTerm]);

    /**
     * @description Uploads book to Cloud and retrieves its URL
     */
    const retrieveBook = useCallback(() => {
        setRetrievingBook(true);

        const server = fetchAPI('');
        server
            .query({
                query: retrievePDFFromArchive,
                variables: {
                    identifier: selectedBook.identifier
                }
            })
            .then((res: any) => {
                if (res.data && res.data.cue.retrievePDFFromArchive) {
                    const html = res.data.cue.retrievePDFFromArchive.toString();
                    const prefix = 'href="';
                    const suffix = '.pdf"';
                    const re = new RegExp(prefix + '.*' + suffix, 'i');
                    const matches = html.match(re);
                    let fileName = matches[0].split('.pdf')[0];
                    fileName = fileName.split('"')[fileName.split('"').length - 1];

                    axios
                        .post(`https://api.learnwithcues.com/uploadPdfToS3`, {
                            url: 'https://archive.org/download/' + selectedBook.identifier + '/' + fileName + '.pdf',
                            title: selectedBook.title + '.pdf'
                        })
                        .then((res2: any) => {
                            if (res2.data) {
                                setRetrievingBook(false);
                                props.onUpload({
                                    url: res2.data,
                                    title: selectedBook.title,
                                    type: 'pdf'
                                });
                            }
                        })
                        .catch(e => {
                            setRetrievingBook(false);
                            alert('This text is currently not available for free. Try another result.');
                            console.log(e);
                        });
                }
            })
            .catch(e => {
                setRetrievingBook(false);
                alert('This text is currently not available for free. Try another result.');
                console.log(e);
            });
    }, [selectedBook]);

    // MAIN RETURN
    return (
        <View
            style={{
                flex: 1,
                height: '100%',
                maxHeight: 800
            }}
        >
            <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'center' }}>
                <TextInput
                    value={searchTerm}
                    style={{
                        width: 300,
                        backgroundColor: '#f2f2f2',
                        fontSize: 20,
                        padding: 15,
                        borderRadius: 25,
                        paddingVertical: 12,
                        marginTop: 0
                    }}
                    placeholder={'🔍'}
                    onChangeText={val => setSearchTerm(val)}
                    placeholderTextColor={'#1F1F1F'}
                />
            </View>
            <View
                style={{
                    width: '100%',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    paddingVertical: 20,
                    marginBottom: 50
                }}
            >
                <TouchableOpacity
                    onPress={() => {
                        handleSearch();
                    }}
                    style={{ backgroundColor: 'white', borderRadius: 15 }}
                >
                    <Text
                        style={{
                            textAlign: 'center',
                            lineHeight: 34,
                            color: 'white',
                            fontSize: 12,
                            backgroundColor: '#4794ff',
                            borderRadius: 15,
                            paddingHorizontal: 20,
                            fontFamily: 'inter',
                            overflow: 'hidden',
                            height: 35,
                            textTransform: 'uppercase'
                        }}
                    >
                        SEARCH
                    </Text>
                </TouchableOpacity>
            </View>
            {loading ? (
                <View
                    style={{
                        width: '100%',
                        height: '100%',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        backgroundColor: '#fff'
                    }}
                >
                    <ActivityIndicator color={'#1F1F1F'} style={{ alignSelf: 'center' }} />
                    <Text
                        style={{
                            marginTop: 15,
                            textAlign: 'center',
                            fontSize: 18,
                            fontFamily: 'Inter'
                        }}
                    >
                        Fetching results...
                    </Text>
                </View>
            ) : (
                <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                    {results.length === 0 ? (
                        !searchComplete ? (
                            <Text
                                style={{
                                    width: '100%',
                                    color: '#393939',
                                    textAlign: 'center',
                                    fontSize: 30,
                                    paddingTop: 50,
                                    paddingBottom: 50,
                                    paddingHorizontal: 5,
                                    fontFamily: 'inter',
                                    flex: 1
                                }}
                            >
                                {/* Browse through over 5 million books & texts */}
                            </Text>
                        ) : (
                            <Text
                                style={{
                                    width: '100%',
                                    textAlign: 'center',
                                    fontSize: 30,
                                    color: '#1f1f1f',
                                    paddingTop: 50,
                                    paddingBottom: 50,
                                    paddingHorizontal: 5,
                                    fontFamily: 'inter',
                                    flex: 1
                                }}
                            >
                                No results found
                            </Text>
                        )
                    ) : (
                        results.map((result: any, index) => {
                            if (index >= (page - 1) * 100 && index < page * 100) {
                                return (
                                    <TouchableOpacity
                                        onPress={() => {
                                            setSelectedBook(result);
                                            // Open the popup that has detailed information
                                        }}
                                        style={{
                                            width: 125,
                                            height: 275,
                                            marginBottom: 30,
                                            marginRight: 10,
                                            marginLeft: 10,
                                            borderRadius: 1,
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <View
                                            style={{
                                                height: 175,
                                                width: 125,
                                                shadowOffset: {
                                                    width: 2,
                                                    height: 2
                                                },
                                                overflow: 'hidden',
                                                shadowOpacity: 0.07,
                                                shadowRadius: 7,
                                                zIndex: 500000
                                                // borderWidth: 1,
                                            }}
                                        >
                                            <Image
                                                style={{
                                                    height: 175,
                                                    width: 125
                                                    // borderWidth: 1,
                                                }}
                                                source={{
                                                    uri: 'https://archive.org/services/img/' + result.identifier
                                                }}
                                            />
                                        </View>
                                        <Text
                                            ellipsizeMode="tail"
                                            style={{
                                                padding: 5,
                                                fontSize: 12,
                                                fontFamily: 'inter',
                                                backgroundColor: '#fff',
                                                height: 75,
                                                paddingTop: 10
                                            }}
                                        >
                                            {result.title}
                                        </Text>
                                        <Text
                                            ellipsizeMode="tail"
                                            style={{
                                                bottom: 0,
                                                padding: 5,
                                                height: 25,
                                                paddingBottom: 10,
                                                fontSize: 12,
                                                fontFamily: 'inter',
                                                backgroundColor: '#fff',
                                                color: '#0061ff'
                                            }}
                                        >
                                            <Ionicons name="bookmark-outline" /> {result.downloads}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            }
                        })
                    )}
                </View>
            )}
            {results.length <= 100 || loading ? null : (
                <View
                    style={{
                        justifyContent: 'center',
                        width: '100%',
                        flexDirection: 'row',
                        marginTop: 25,
                        marginBottom: 50
                    }}
                >
                    <TouchableOpacity
                        onPress={() => {
                            setPage(page <= 0 ? 0 : page - 1);
                        }}
                    >
                        <Text>
                            <Ionicons name="arrow-back-circle-outline" size={30} color="#4794ff" />
                        </Text>
                    </TouchableOpacity>
                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center' }}>
                        <Text
                            style={{
                                fontSize: 20,
                                fontFamily: 'inter'
                            }}
                        >
                            {page}/{Math.floor(results.length / 100)}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            setPage(page * 100 > results.length ? page : page + 1);
                        }}
                    >
                        <Text>
                            <Ionicons name="arrow-forward-circle-outline" size={30} color="#4794ff" />
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
            <Popup
                isOpen={selectedBook !== null}
                buttons={[
                    {
                        text: 'CLOSE',
                        handler: function(event: any) {
                            if (retrievingBook) {
                                return;
                            }
                            setSelectedBook(null);
                        }
                    },
                    {
                        text: 'NEXT',
                        handler: function(event: any) {
                            if (retrievingBook) {
                                return;
                            }
                            retrieveBook();
                        }
                    }
                ]}
                theme="ios"
                themeVariant="light"
                onClose={() => setSelectedBook(null)}
                responsive={{
                    small: {
                        display: 'bottom'
                    },
                    medium: {
                        display: 'center'
                    }
                }}
            >
                {!retrievingBook && selectedBook ? (
                    <View
                        style={{ flexDirection: 'column', padding: 25, backgroundColor: 'none' }}
                        className="mbsc-align-center mbsc-padding"
                    >
                        <View
                            style={{
                                height: 245,
                                width: 175,
                                shadowOffset: {
                                    width: 2,
                                    height: 2
                                },
                                overflow: 'hidden',
                                shadowOpacity: 0.07,
                                shadowRadius: 7,
                                zIndex: 500000,
                                alignSelf: 'center'
                            }}
                        >
                            <Image
                                style={{
                                    height: 245,
                                    width: 175
                                }}
                                source={{ uri: 'https://archive.org/services/img/' + selectedBook.identifier }}
                            />
                        </View>
                        <Text
                            ellipsizeMode="tail"
                            style={{
                                padding: 5,
                                fontSize: 20,
                                fontFamily: 'inter',
                                backgroundColor: '#f2f2f7',
                                maxHeight: 75,
                                marginTop: 25,
                                paddingTop: 10
                            }}
                        >
                            {selectedBook.title}
                        </Text>
                        <Text
                            ellipsizeMode="tail"
                            style={{
                                bottom: 0,
                                padding: 5,
                                height: 25,
                                paddingBottom: 10,
                                fontSize: 12,
                                fontFamily: 'inter',
                                backgroundColor: '#f2f2f7',
                                color: '#0061ff'
                            }}
                        >
                            <Ionicons name="bookmark-outline" /> {selectedBook.downloads}
                        </Text>
                        <Text
                            ellipsizeMode="tail"
                            style={{
                                padding: 5,
                                fontSize: 12,
                                fontFamily: 'inter',
                                backgroundColor: '#f2f2f7',
                                maxHeight: 200,
                                paddingTop: 10
                            }}
                        >
                            {selectedBook.description}
                        </Text>
                    </View>
                ) : retrievingBook ? (
                    <View
                        style={{
                            padding: 25,
                            justifyContent: 'center',
                            flexDirection: 'column',
                            backgroundColor: '#f2f2f7'
                        }}
                    >
                        <View
                            style={{
                                height: 245,
                                width: 175,
                                justifyContent: 'center',
                                flexDirection: 'column',
                                backgroundColor: '#f2f2f7'
                            }}
                        >
                            <ActivityIndicator color={'#1F1F1F'} style={{ alignSelf: 'center' }} />
                            <Text
                                style={{
                                    marginTop: 15,
                                    textAlign: 'center',
                                    fontSize: 18,
                                    fontFamily: 'Inter'
                                }}
                            >
                                Retrieving text...
                            </Text>
                        </View>
                    </View>
                ) : null}
            </Popup>
        </View>
    );
};

export default Books;
