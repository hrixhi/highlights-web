import React, { useEffect, useState } from 'react';
import { StyleSheet, Image } from 'react-native';
import { Text, TouchableOpacity, View } from './Themed';
import _ from 'lodash'
import axios from 'axios';
import { TextInput } from './CustomTextInput';

const Books: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const styleObject = styles()
    const [searchTerm, setSearchTerm] = useState('')
    const [page, setPage] = useState(1)
    const [results, setReults] = useState<any[]>([])


    useEffect(() => {
        if (!searchTerm || searchTerm === '') {
            return
        }
        // make request here...
        (async () => {
            const url = 'https://archive.org/services/search/v1/scrape?fields=title,identifier,mediatype,format,description,downloads&q='
            const response = await axios.get(url + encodeURIComponent(searchTerm))
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
            console.log(filteredItems)
            filteredItems.sort((a: any, b: any) => {
                if(a.downloads > b.downloads) {
                    return -1
                } else if(a.downloads < b.downloads) {
                    return 1
                } else {
                    return 0
                }
            })
            setReults(filteredItems)
        })()
    }, [searchTerm])

    return (
        <View>
            <View style={{}}>
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
                    placeholder={"Browse Books & Texts"}
                    onChangeText={(val) => setSearchTerm(val)}
                    placeholderTextColor={"#1F1F1F"}
                />
            </View>
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', flexWrap: 'wrap' }}>
                {
                    results.map((result: any, index) => {
                        if (index >= page * 50 && index < (page + 1) * 50) {
                            return <View style={{ width: 100, height: 400, marginBottom: 50, marginRight: 20, marginLeft: 20 }}>
                                <Image
                                    style={{
                                        height: 200,
                                        width: 100,
                                    }}
                                    source={{ uri: 'https://archive.org/services/img/' + result.identifier }}
                                />
                                <Text ellipsizeMode='tail' style={{ marginTop: 15, fontSize: 18, fontFamily: 'inter' }}>
                                    {result.title}
                                </Text>
                                <Text ellipsizeMode='tail' style={{ marginTop: 15, fontSize: 18, fontFamily: 'inter' }}>
                                    {result.downloads}
                                </Text>
                                {/* <Text>
                                    {result.description}
                                </Text> */}
                            </View>
                        }
                    })
                }
            </View>
            {
                results.length <= 50 ? null : <View style={{ justifyContent: 'center', flex: 1, flexDirection: 'row' }}>
                    <TouchableOpacity
                        onPress={() => {
                            setPage(page <= 0 ? 0 : page - 1)
                        }}
                    >
                        <Text>
                            {"<"}
                        </Text>
                    </TouchableOpacity>
                    <View>
                        <Text>
                            {page}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            setPage(page * 50 > results.length ? page : page + 1)
                        }}>
                        <Text>
                            {">"}
                        </Text>
                    </TouchableOpacity>
                </View>
            }
        </View>
    );
}

export default Books

const styles: any = () => StyleSheet.create({

});
