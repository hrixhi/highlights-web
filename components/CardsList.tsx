import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Animated, Alert, Dimensions } from 'react-native';
import Swiper from 'react-native-web-swiper'
import { Text, View, TouchableOpacity } from '../components/Themed';
import Card from './Card'
import _ from 'lodash'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScrollView } from 'react-native-gesture-handler';

const CardsList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const unparsedCues: any[] = JSON.parse(JSON.stringify(props.cues))
    const [cues] = useState<any[]>(unparsedCues.reverse())
    const [numCards] = useState(5)
    const [filterChoice, setFilterChoice] = useState(props.channelFilterChoice)
    let filteredCues: any[] = []
    if (filterChoice === 'All') {
        filteredCues = cues
    } else {
        filteredCues = cues.filter((cue) => {
            return cue.customCategory === filterChoice
        })
    }
    const styles = styleObject(props.channelId)
    const pages = new Array(Math.ceil(filteredCues.length / numCards))
    for (let i = 0; i < pages.length; i++) {
        pages[i] = 0
    }

    const noChannelCuesAlert = useCallback(async () => {
        if (props.channelId && props.channelId !== '') {
            const u = await AsyncStorage.getItem("user")
            if (u) {
                const user = JSON.parse(u)
                if (user._id.toString().trim() === props.createdBy.toString().trim()) {
                    if (cues.length === 0) {
                        Alert.alert("Click + and select this channel to broadcast a cue.")
                    }
                }
            }
        }
    }, [props.channelId, props.createdBy, cues])

    useEffect(() => {
        noChannelCuesAlert()
    }, [])

    return (
        <Animated.View style={{
            height: '100%',
            opacity: props.fadeAnimation,
            width: Dimensions.get('window').width * 0.3,
            paddingHorizontal: 20
        }}>
            <ScrollView
                horizontal={false}
                contentContainerStyle={{
                    width: Dimensions.get('window').width * 0.3 - 70,
                    height: (Dimensions.get('window').height - 30) * 0.7,
                }}
            >
                <View style={styles.marginSmall} />
                {
                    filteredCues.map((cue: any, index: number) => {
                        return <View style={{ height: '20%' }}>
                            <Card
                                fadeAnimation={props.fadeAnimation}
                                updateModal={() => props.openUpdate(
                                    filteredCues[index].key,
                                    filteredCues[index].index,
                                    0,
                                    filteredCues[index]._id,
                                    (filteredCues[index].createdBy ? filteredCues[index].createdBy : ''),
                                    (filteredCues[index].channelId ? filteredCues[index].channelId : '')
                                )}
                                cue={filteredCues[index]}
                                channelId={props.channelId}
                            />
                            <View style={styles.margin} />
                        </View>
                    })
                }
                <View style={styles.marginSmall} />
            </ScrollView>
            {/* {
                filteredCues.length > 0 ?
                    <Swiper
                        vertical={true}
                        controlsEnabled={true}
                        controlsProps={{
                            dotsTouchable: true,
                            prevPos: 'top-right',
                            nextPos: 'bottom-right',
                            nextTitle: '',
                            nextTitleStyle: { color: '#0079fe', fontSize: 20, fontFamily: 'overpass' },
                            prevTitle: '',
                            prevTitleStyle: { color: '#0079fe', fontSize: 20, fontFamily: 'overpass' },
                            dotActiveStyle: { backgroundColor: pages.length === 1 ? '#fff' : '#0079fe' }
                        }}
                    >
                        {
                            pages.map((pageUndef, pageNumber) => {
                                const index = (pageNumber * numCards);
                                return <View style={styles.screen} key={Math.random()}>
                                    <View style={styles.marginSmall} />
                                    {
                                        (index + 0 > filteredCues.length - 1) ? null :
                                            <Card
                                                fadeAnimation={props.fadeAnimation}
                                                updateModal={() => props.openUpdate(
                                                    filteredCues[index + 0].key,
                                                    filteredCues[index + 0].index,
                                                    pageNumber,
                                                    filteredCues[index + 0]._id,
                                                    (filteredCues[index + 0].createdBy ? filteredCues[index + 0].createdBy : ''),
                                                    (filteredCues[index + 0].channelId ? filteredCues[index + 0].channelId : '')
                                                )}
                                                cue={filteredCues[index + 0]}
                                                channelId={props.channelId}
                                            />
                                    }
                                    <View style={styles.margin} />
                                    {
                                        (index + 1 > filteredCues.length - 1) ? null :
                                            <Card
                                                fadeAnimation={props.fadeAnimation}
                                                updateModal={() => props.openUpdate(
                                                    filteredCues[index + 1].key,
                                                    filteredCues[index + 1].index,
                                                    pageNumber,
                                                    filteredCues[index + 1]._id,
                                                    (filteredCues[index + 1].createdBy ? filteredCues[index + 1].createdBy : ''),
                                                    (filteredCues[index + 1].channelId ? filteredCues[index + 1].channelId : '')
                                                )}
                                                cue={filteredCues[index + 1]}
                                                channelId={props.channelId}
                                            />
                                    }
                                    <View style={styles.margin} />
                                    {
                                        (index + 2 > filteredCues.length - 1) ? null :
                                            <Card
                                                fadeAnimation={props.fadeAnimation}
                                                updateModal={() => props.openUpdate(
                                                    filteredCues[index + 2].key,
                                                    filteredCues[index + 2].index,
                                                    pageNumber,
                                                    filteredCues[index + 2]._id,
                                                    (filteredCues[index + 2].createdBy ? filteredCues[index + 2].createdBy : ''),
                                                    (filteredCues[index + 2].channelId ? filteredCues[index + 2].channelId : '')
                                                )}
                                                cue={filteredCues[index + 2]}
                                                channelId={props.channelId}
                                            />
                                    }
                                    <View style={styles.margin} />
                                    {
                                        (index + 3 > filteredCues.length - 1) ? null :
                                            <Card
                                                fadeAnimation={props.fadeAnimation}
                                                updateModal={() => props.openUpdate(
                                                    filteredCues[index + 3].key,
                                                    filteredCues[index + 3].index,
                                                    pageNumber,
                                                    filteredCues[index + 3]._id,
                                                    (filteredCues[index + 3].createdBy ? filteredCues[index + 3].createdBy : ''),
                                                    (filteredCues[index + 3].channelId ? filteredCues[index + 3].channelId : '')
                                                )}
                                                cue={filteredCues[index + 3]}
                                                channelId={props.channelId}
                                            />
                                    }
                                    <View style={styles.margin} />
                                    {
                                        (index + 4 > filteredCues.length - 1) ? null :
                                            <Card
                                                fadeAnimation={props.fadeAnimation}
                                                updateModal={() => props.openUpdate(
                                                    filteredCues[index + 4].key,
                                                    filteredCues[index + 4].index,
                                                    pageNumber,
                                                    filteredCues[index + 4]._id,
                                                    (filteredCues[index + 4].createdBy ? filteredCues[index + 4].createdBy : ''),
                                                    (filteredCues[index + 4].channelId ? filteredCues[index + 4].channelId : '')
                                                )}
                                                cue={filteredCues[index + 4]}
                                                channelId={props.channelId}

                                            />
                                    }
                                    <View style={styles.marginSmall} />
                                </View>
                            })
                        }
                    </Swiper> :
                    <View style={{ padding: 15, paddingTop: 75, width: '100%' }}>
                        <Text style={{ fontSize: 25, color: '#a6a2a2', fontWeight: 'bold', fontFamily: 'inter' }}>
                            No cues found.
                        </Text>
                    </View>
            } */}
        </Animated.View >
    );
}

export default React.memo(CardsList, (prev, next) => {
    return _.isEqual(prev.cues, next.cues)
})


const styleObject = (channelId: any) => {
    return StyleSheet.create({
        screen: {
            height: '100%',
            width: Dimensions.get('window').width * 0.3 - 40
        },
        margin: {
            flex: 1
        },
        marginSmall: {
            height: '1.25%'
        },
        page: {
            flexDirection: 'column',
        }
    })
}
