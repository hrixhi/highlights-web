// REACT
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Switch, TextInput, Dimensions, ActivityIndicator, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity } from './Themed';
import { Popup } from '@mobiscroll/react';
import axios from 'axios';
import Alert from './Alert';
import ReactPlayer from 'react-player';

const InsertYoutubeModal: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [nextPageToken, setNextPageToken] = useState('');
    const [prevPageToken, setPrevPageToken] = useState('');
    const [error, setError] = useState('');
    const [totalResults, setTotalResults] = useState(0);
    const [searchedForResults, setSearchedForResults] = useState(false);
    const [playVideoId, setPlayVideoId] = useState('');

    const YOUTUBE_API_KEY = 'AIzaSyCQfeWsl2t-_wrCdhd9Pv1xv9QfGaPUg9A';

    const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

    const searchVideos = useCallback(
        (pageToken?: string) => {
            if (searchTerm === '') {
                Alert('Enter search term.');
                setIsSearching(false);
                setSearchResults([]);
                setNextPageToken('');
                setPrevPageToken('');
                setTotalResults(0);
                setSearchedForResults(false);
                return;
            }

            setIsSearching(true);

            axios
                .get(
                    SEARCH_URL +
                        '?part=snippet&key=' +
                        YOUTUBE_API_KEY +
                        '&type=video&q=' +
                        searchTerm +
                        '&maxResults=50' +
                        (pageToken && pageToken !== '' ? `&pageToken=${pageToken}` : '')
                )
                .then((res: any) => {
                    if (res && res.status === 200 && res.data) {
                        setIsSearching(false);
                        setError('');

                        setSearchResults(res.data.items);

                        if (res.data.nextPageToken) {
                            setNextPageToken(res.data.nextPageToken);
                        }

                        if (res.data.prevPageToken) {
                            setPrevPageToken(res.data.prevPageToken);
                        }

                        setTotalResults(res.data.pageInfo.totalResults);

                        setSearchedForResults(true);
                    } else {
                        setError('Could not load results. Check internet connection.');
                        setSearchedForResults(false);
                    }
                });
        },
        [searchTerm]
    );

    return (
        <Popup
            isOpen={props.show}
            buttons={[
                {
                    text: 'Cancel',
                    color: 'dark',
                    handler: function (event) {
                        props.onClose();
                    },
                },
            ]}
            theme="ios"
            themeVariant="light"
            onClose={() => props.onClose()}
            responsive={{
                small: {
                    display: 'bottom',
                },
                medium: {
                    // Custom breakpoint
                    display: 'center',
                },
            }}
            scrollLock={false}
        >
            <View
                style={{
                    width: 500,
                    backgroundColor: '#f8f8f8',
                }}
            >
                {/* <View
                    style={{
                        paddingTop: 20,
                        paddingHorizontal: 20,
                        backgroundColor: '#f8f8f8',
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}
                >
                    <TextInput
                        value={searchTerm}
                        style={{
                            // width: '100%',
                            flex: 1,
                            backgroundColor: '#f8f8f8',
                            fontSize: 15,
                            padding: 15,
                            borderRadius: 25,
                            paddingVertical: 12,
                            marginTop: 0,
                            borderWidth: 1,
                            borderColor: '#a9a9a9',
                        }}
                        placeholder={'🔍'}
                        onChangeText={(val) => setSearchTerm(val)}
                        placeholderTextColor={'#1F1F1F'}
                    />
                    <TouchableOpacity
                        style={{
                            backgroundColor: 'white',
                            borderRadius: 15,
                            overflow: 'hidden',
                            height: 35,
                            marginLeft: 20,
                        }}
                        onPress={() => {
                            searchVideos();
                        }}
                    >
                        <Text
                            style={{
                                textAlign: 'center',
                                color: 'white',
                                fontSize: 13,
                                backgroundColor: '#007AFF',
                                paddingHorizontal: 20,
                                fontFamily: 'inter',
                                lineHeight: 35,
                                height: 35,
                                textTransform: 'uppercase',
                                width: 100,
                            }}
                        >
                            Search
                        </Text>
                    </TouchableOpacity>
                </View> */}
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignSelf: 'center',
                        alignItems: 'center',
                        width: '100%',
                        paddingTop: 20,
                        backgroundColor: 'none',
                    }}
                >
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#fff',
                            paddingVertical: 12,
                            paddingHorizontal: 15,
                            borderRadius: 24,
                            width: 300,
                            flex: 1,
                        }}
                    >
                        <Ionicons size={20} name="search-outline" color={'#1f1f1f'} style={{}} />
                        <TextInput
                            value={searchTerm}
                            style={{
                                color: '#1f1f1f',
                                backgroundColor: 'none',
                                fontSize: 15,
                                flex: 1,
                                fontFamily: 'Inter',
                                paddingLeft: 10,
                                paddingVertical: 5,
                            }}
                            placeholder={'Search topic, description, channel, etc.'}
                            onChangeText={(val) => setSearchTerm(val)}
                            placeholderTextColor={'#1f1f1f'}
                        />
                        {searchTerm !== '' ? (
                            <TouchableOpacity
                                style={{
                                    marginLeft: 'auto',
                                    backgroundColor: '#fff',
                                    width: 15,
                                }}
                                onPress={() => {
                                    setSearchTerm('');
                                }}
                            >
                                <Ionicons name="close-outline" size={20} color="#1f1f1f" />
                            </TouchableOpacity>
                        ) : (
                            <View
                                style={{
                                    marginLeft: 'auto',
                                    width: 15,
                                }}
                            />
                        )}
                    </View>
                    <View
                        style={{
                            backgroundColor: 'none',
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => {
                                searchVideos();
                            }}
                            style={{ backgroundColor: 'none', borderRadius: 15, marginLeft: 30 }}
                        >
                            <Text
                                style={{
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    borderColor: '#000',
                                    borderWidth: 1,
                                    color: '#fff',
                                    backgroundColor: '#000',
                                    fontSize: 11,
                                    paddingHorizontal: 24,
                                    fontFamily: 'inter',
                                    overflow: 'hidden',
                                    paddingVertical: 14,
                                    textTransform: 'uppercase',
                                    width: 120,
                                }}
                            >
                                SEARCH
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
                {/*  */}
                {isSearching ? (
                    <View
                        style={{
                            width: '100%',
                            flex: 1,
                            justifyContent: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            paddingVertical: 50,
                            backgroundColor: '#f8f8f8',
                        }}
                    >
                        <ActivityIndicator color={'#000'} />
                    </View>
                ) : (
                    <View
                        style={{
                            marginTop: 20,
                            backgroundColor: '#f8f8f8',
                            width: '100%',
                            maxHeight: 400,
                            overflow: 'scroll',
                            flexDirection: 'column',
                        }}
                    >
                        {totalResults === 0 ? (
                            <View
                                style={{
                                    backgroundColor: '#f8f8f8',
                                    paddingVertical: 100,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 20,
                                        fontFamily: 'Inter',
                                        textAlign: 'center',
                                    }}
                                >
                                    {searchedForResults ? 'No Results Found.' : 'Browse YouTube videos'}
                                </Text>
                            </View>
                        ) : null}
                        {searchedForResults && totalResults > 0 ? (
                            <View
                                style={{
                                    backgroundColor: '#f8f8f8',
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 15,
                                    }}
                                >
                                    {totalResults} results found.
                                </Text>
                            </View>
                        ) : null}
                        {searchResults.map((result: any) => {
                            const { title, description, channelTitle } = result.snippet;
                            const imageURL = result.snippet.thumbnails.medium.url;
                            const { videoId } = result.id;

                            return (
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'flex-start',
                                        backgroundColor: '#f8f8f8',
                                        marginVertical: 20,
                                    }}
                                >
                                    <View
                                        style={{
                                            width: '60%',
                                            backgroundColor: '#f8f8f8',
                                        }}
                                    >
                                        {playVideoId === videoId ? (
                                            <ReactPlayer
                                                url={`https://youtube.com/embed/${videoId}`}
                                                controls={true}
                                                onContextMenu={(e: any) => e.preventDefault()}
                                                config={{
                                                    file: { attributes: { controlsList: 'nodownload' } },
                                                }}
                                                width={'100%'}
                                                height={'100%'}
                                            />
                                        ) : (
                                            <Image
                                                source={{
                                                    uri: imageURL,
                                                }}
                                                style={{
                                                    height: 150,
                                                    width: '100%',
                                                }}
                                            />
                                        )}
                                    </View>
                                    <View
                                        style={{
                                            flexDirection: 'column',
                                            width: '40%',
                                            paddingHorizontal: 10,
                                            backgroundColor: '#f8f8f8',
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 16,
                                                fontFamily: 'Inter',
                                                marginBottom: 10,
                                            }}
                                            numberOfLines={3}
                                            ellipsizeMode="tail"
                                        >
                                            {title}
                                        </Text>
                                        <Text
                                            style={{
                                                fontSize: 15,
                                            }}
                                        >
                                            {channelTitle}
                                        </Text>
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                paddingTop: 20,
                                                backgroundColor: '#f8f8f8',
                                            }}
                                        >
                                            {/* Play button */}
                                            {playVideoId === videoId ? null : (
                                                <TouchableOpacity
                                                    style={{
                                                        marginRight: 20,
                                                        borderRadius: 15,
                                                        overflow: 'hidden',
                                                        height: 30,
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        backgroundColor: '#f8f8f8',
                                                    }}
                                                    onPress={() => {
                                                        setPlayVideoId(videoId);
                                                    }}
                                                >
                                                    <Ionicons name="play-outline" size={18} color={'#007AFF'} />
                                                    <Text
                                                        style={{
                                                            textAlign: 'center',
                                                            color: '#007AFF',
                                                            fontSize: 15,
                                                            fontFamily: 'inter',
                                                            lineHeight: 30,
                                                            height: 30,
                                                            textTransform: 'uppercase',
                                                            marginLeft: 5,
                                                        }}
                                                    >
                                                        Play
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                            {/* Add button */}
                                            <TouchableOpacity
                                                style={{
                                                    borderRadius: 15,
                                                    overflow: 'hidden',
                                                    height: 30,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    backgroundColor: '#f8f8f8',
                                                }}
                                                onPress={() => {
                                                    props.insertVideo(videoId);
                                                }}
                                            >
                                                <Ionicons name="add-outline" size={20} color={'#007AFF'} />
                                                <Text
                                                    style={{
                                                        textAlign: 'center',
                                                        color: '#007AFF',
                                                        fontSize: 15,
                                                        fontFamily: 'inter',
                                                        lineHeight: 30,
                                                        height: 30,
                                                        textTransform: 'uppercase',
                                                        marginLeft: 5,
                                                    }}
                                                >
                                                    Add
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Next and prev buttons */}
                {searchedForResults && totalResults !== 0 ? (
                    <View
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            backgroundColor: '#f8f8f8',
                            marginTop: 10,
                            paddingHorizontal: 10,
                        }}
                    >
                        {prevPageToken !== '' ? (
                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#f8f8f8',
                                }}
                                onPress={() => searchVideos(prevPageToken)}
                            >
                                <Text
                                    style={{
                                        color: '#007AFF',
                                    }}
                                >
                                    Previous
                                </Text>
                            </TouchableOpacity>
                        ) : null}

                        {/*  */}

                        {nextPageToken !== '' ? (
                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#f8f8f8',
                                    marginLeft: 'auto',
                                }}
                                onPress={() => searchVideos(nextPageToken)}
                            >
                                <Text
                                    style={{
                                        color: '#007AFF',
                                    }}
                                >
                                    Next
                                </Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                ) : null}
            </View>
        </Popup>
    );
};

export default InsertYoutubeModal;
