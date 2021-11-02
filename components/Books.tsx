import React, { useCallback, useState } from 'react';
import { StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Text, TouchableOpacity, View } from './Themed';
import _ from 'lodash'
import axios from 'axios';
import { TextInput } from './CustomTextInput';
import alert from './Alert';
import { Ionicons } from '@expo/vector-icons';
import { Popup } from '@mobiscroll/react5'
import '@mobiscroll/react/dist/css/mobiscroll.react.min.css';
import { fetchAPI } from '../graphql/FetchAPI';
import { retrievePDFFromArchive, getS3LinkForArchive } from '../graphql/QueriesAndMutations';

const Books: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const styleObject = styles()
    const [searchTerm, setSearchTerm] = useState('')
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [searchComplete, setSearchComplete] = useState(false)
    const [results, setResults] = useState<any[]>([])
    const [selectedBook, setSelectedBook] = useState<any>(null)

    const handleSearch = useCallback(() => {
        if (!searchTerm || searchTerm === '') {
            alert('Enter search input.')
            return
        }
        // make request here...
        (async () => {
            setLoading(true)
            setSearchComplete(false)
            const url = 'https://archive.org/services/search/v1/scrape?fields=title,identifier,mediatype,format,description,downloads&q='
            const response = await axios.get(url + encodeURIComponent(searchTerm) + '&sorts=' + encodeURIComponent('downloads desc') + '&count=100')
            const items = response.data.items
            const filteredItems = items.filter((item: any) => {
                if (item.mediatype !== 'texts') {
                    return false
                }
                let pdfExists = false
                try {
                    pdfExists = item.format && item.format.length > 0 && item.format.find((i: any) => {
                        return i === 'Text PDF'
                    })
                } catch (e) {
                    console.log(item.format)
                }
                return pdfExists
            })
            setResults(filteredItems)
            setSearchComplete(true)
            setLoading(false)
        })()
    }, [searchTerm])

    const retrieveBook = useCallback(() => {
        const server = fetchAPI('')
        server.query({
            query: retrievePDFFromArchive,
            variables: {
                identifier: selectedBook.identifier
            }
        }).then((res: any) => {
            if (res.data && res.data.cue.retrievePDFFromArchive) {
                const html = res.data.cue.retrievePDFFromArchive.toString()
                const prefix = 'href="'
                const suffix = '.pdf"'
                const re = new RegExp(prefix + ".*" + suffix, "i")
                const matches = html.match(re)
                console.log(matches)
                let fileName = matches[0].split('.pdf')[0]
                fileName = fileName.split('"')[(fileName.split('"')).length - 1]

                // server.query({
                //     query: getS3LinkForArchive,
                //     variables: {
                //         url: 'https://archive.org/download/' + selectedBook.identifier + '/' + fileName + '.pdf',
                //         title: fileName
                //     }
                // }).then((res: any) => {
                //     if (res.data && res.data.cue.getS3LinkForArchive) {

                //         props.onUpload({
                //             url: res.data.cue.getS3LinkForArchive,
                //             title: selectedBook.title,
                //             type: 'pdf'
                //         })
                //     }
                // })

                axios.post(`http://localhost:8081/uploadPdfToS3`,
                    {
                        url: 'https://archive.org/download/' + selectedBook.identifier + '/' + fileName + '.pdf',
                        title: fileName
                    },
                ).then((res: any) => {
                    if (res.data) {
                        console.log("res.data", res.data)
                        props.onUpload({
                            url: res.data,
                            title: selectedBook.title,
                            type: 'pdf'
                        })
                    }
                })

                
                
            }
        })
    }, [selectedBook])

    return (
        <View style={{
            flex: 1, height: '100%',
            maxHeight: 800
        }}>
            <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'center' }}>
                <TextInput
                    value={searchTerm}
                    style={{
                        width: 300,
                        backgroundColor: "#efefef",
                        // borderWidth: 1,
                        fontSize: 20,
                        padding: 15,
                        borderRadius: 25,
                        paddingVertical: 12,
                        marginTop: 0,
                    }}
                    placeholder={"🔍"}
                    onChangeText={(val) => setSearchTerm(val)}
                    placeholderTextColor={"#1F1F1F"}
                />
            </View>
            <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'center', paddingVertical: 20, marginBottom: 50 }}>
                <TouchableOpacity
                    onPress={() => {
                        handleSearch()
                    }}
                    style={{ backgroundColor: "white", borderRadius: 15 }}>
                    <Text
                        style={{
                            textAlign: "center",
                            lineHeight: 35,
                            color: "white",
                            fontSize: 12,
                            backgroundColor: "#006AFF",
                            borderRadius: 15,
                            paddingHorizontal: 20,
                            fontFamily: "inter",
                            overflow: "hidden",
                            height: 35,
                            textTransform: 'uppercase'
                        }}>
                        SEARCH
                    </Text>
                </TouchableOpacity>
            </View>
            {
                loading ? <View
                    style={{
                        width: "100%",
                        height: '100%',
                        justifyContent: "center",
                        flexDirection: "column",
                        backgroundColor: '#fff'
                    }}>
                    <ActivityIndicator color={"#1F1F1F"} style={{ alignSelf: 'center' }} />
                </View> : <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                    {
                        results.length === 0 ? (
                            !searchComplete
                                ? <Text style={{
                                    width: '100%', color: '#393939',
                                    textAlign: 'center',
                                    fontSize: 30, paddingTop: 50,
                                    paddingBottom: 50, paddingHorizontal: 5, fontFamily: 'inter', flex: 1
                                }}>
                                    Browse over 10 million books & texts
                                </Text>
                                : <Text style={{
                                    width: '100%', textAlign: 'center', fontSize: 30,
                                    color: '#1f1f1f', paddingTop: 50, paddingBottom: 50,
                                    paddingHorizontal: 5, fontFamily: 'inter', flex: 1
                                }}>
                                    No results found
                                </Text>
                        ) : results.map((result: any, index) => {
                            if (index >= (page - 1) * 100 && index < (page) * 100) {
                                return <TouchableOpacity
                                    onPress={() => {
                                        setSelectedBook(result)
                                        // Open the popup that has detailed information
                                    }}
                                    style={{
                                        width: 125, height: 275,
                                        marginBottom: 30,
                                        marginRight: 10, marginLeft: 10,
                                        borderRadius: 1,
                                        overflow: 'hidden'
                                    }}>
                                    <View style={{
                                        height: 175,
                                        width: 125,
                                        shadowOffset: {
                                            width: 2,
                                            height: 2,
                                        },
                                        overflow: 'hidden',
                                        shadowOpacity: 0.07,
                                        shadowRadius: 7,
                                        zIndex: 500000,
                                        // borderWidth: 1,
                                    }}>
                                        <Image
                                            style={{
                                                height: 175,
                                                width: 125,
                                                // borderWidth: 1,
                                            }}
                                            source={{ uri: 'https://archive.org/services/img/' + result.identifier }}
                                        />
                                    </View>
                                    <Text ellipsizeMode='tail' style={{
                                        padding: 5, fontSize: 12, fontFamily: 'inter', backgroundColor: '#fff', height: 75,
                                        paddingTop: 10
                                    }}>
                                        {result.title}
                                    </Text>
                                    <Text ellipsizeMode='tail' style={{
                                        bottom: 0,
                                        padding: 5,
                                        height: 25,
                                        // marginTop: 15, 
                                        paddingBottom: 10,
                                        fontSize: 12, fontFamily: 'inter', backgroundColor: '#fff', color: '#0061ff'
                                    }}>
                                        <Ionicons name='bookmark-outline' /> {result.downloads}
                                    </Text>
                                    {/* <Text>
                                    {result.description}
                                </Text> */}
                                </TouchableOpacity>
                            }
                        })
                    }
                </View>
            }
            {
                results.length <= 100 || loading ? null : <View style={{ justifyContent: 'center', width: '100%', flexDirection: 'row', marginTop: 25, marginBottom: 50 }}>
                    <TouchableOpacity
                        onPress={() => {
                            setPage(page <= 0 ? 0 : page - 1)
                        }}
                    >
                        <Text>
                            <Ionicons name='arrow-back-circle-outline' size={30} color='#006aff' />
                        </Text>
                    </TouchableOpacity>
                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center' }}>
                        <Text style={{
                            fontSize: 20, fontFamily: 'inter'
                        }}>
                            {page}/{Math.floor(results.length / 100)}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            setPage(page * 100 > results.length ? page : page + 1)
                        }}>
                        <Text>
                            <Ionicons name="arrow-forward-circle-outline" size={30} color='#006aff' />
                        </Text>
                    </TouchableOpacity>
                </View>
            }
            <Popup isOpen={selectedBook !== null}
                buttons={[
                    {
                        text: 'CLOSE',
                        handler: function (event: any) {
                            setSelectedBook(null)
                        }
                    },
                    {
                        text: 'NEXT',
                        handler: function (event: any) {
                            // setShowFilterPopup(false)
                            retrieveBook()
                        }
                    },
                ]}
                themeVariant="light"
                onClose={() => setSelectedBook(null)}
                responsive={{
                    small: {
                        display: 'bottom'
                    },
                    medium: {
                        display: 'center'
                    },

                }}
            >
                {
                    selectedBook ? <View style={{ flexDirection: 'column', padding: 25, backgroundColor: 'none' }} className="mbsc-align-center mbsc-padding">
                        <View style={{
                            height: 245,
                            width: 175,
                            shadowOffset: {
                                width: 2,
                                height: 2,
                            },
                            overflow: 'hidden',
                            shadowOpacity: 0.07,
                            shadowRadius: 7,
                            zIndex: 500000,
                            alignSelf: 'center'
                            // borderWidth: 1,
                        }}>
                            <Image
                                style={{
                                    height: 245,
                                    width: 175,
                                    // borderWidth: 1,
                                }}
                                source={{ uri: 'https://archive.org/services/img/' + selectedBook.identifier }}
                            />
                        </View>
                        <Text ellipsizeMode='tail' style={{
                            padding: 5, fontSize: 20, fontFamily: 'inter', backgroundColor: '#efefef', maxHeight: 75,
                            marginTop: 25,
                            paddingTop: 10
                        }}>
                            {selectedBook.title}
                        </Text>
                        <Text ellipsizeMode='tail' style={{
                            bottom: 0,
                            padding: 5,
                            height: 25,
                            // marginTop: 15, 
                            paddingBottom: 10,
                            fontSize: 12, fontFamily: 'inter', backgroundColor: '#efefef', color: '#0061ff'
                        }}>
                            <Ionicons name='bookmark-outline' /> {selectedBook.downloads}
                        </Text>
                        <Text ellipsizeMode='tail' style={{
                            padding: 5, fontSize: 12, fontFamily: 'inter', backgroundColor: '#efefef', maxHeight: 200,
                            paddingTop: 10
                        }}>
                            {selectedBook.description}
                        </Text>
                    </View> : null
                }
            </Popup>
        </View >
    );
}

export default Books

const styles: any = () => StyleSheet.create({

});
