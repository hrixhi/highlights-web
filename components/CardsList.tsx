import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Animated, Alert, Dimensions } from 'react-native';
import Swiper from 'react-native-swiper'
import { Text, View, TouchableOpacity } from '../components/Themed';
import Card from './Card'
import _ from 'lodash'
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CardsList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const unparsedCues: any[] = JSON.parse(JSON.stringify(props.cues))
    const [cues] = useState<any[]>(unparsedCues.reverse())
    const [numCards] = useState(5)
    const channelCategories: any[] = []
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
            width: Dimensions.get('window').width * 0.27,
            paddingRight: 20,
            // borderColor: '#eaeaea',
            // borderLeftWidth: 1,
            // borderRightWidth: 1,
        }}>
            {
                filteredCues.length > 0 ?
                    <Swiper
                        containerStyle={{
                            width: Dimensions.get('window').width * 0.27 - 40
                        }}
                        index={props.pageNumber}
                        activeDotColor={'#0079FE'}
                        horizontal={false}
                        dotColor={'#e0e0e0'}
                        dotStyle={{ marginRight: -5, marginBottom: 5, opacity: 1 }}
                        activeDotStyle={{ marginRight: -5, marginBottom: 5, opacity: 1 }}
                        loadMinimal={true}
                        loadMinimalSize={1}
                        loop={props.channelId !== '' ? false : true}
                    >
                        {
                            pages.map((pageUndef, pageNumber) => {
                                const index = (pageNumber * numCards);
                                return <View style={styles.screen} key={Math.random()}>
                                    <View style={styles.row}>
                                        <View style={styles.col}>
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
                                    </View>
                                </View>
                            })
                        }
                    </Swiper> :
                    <View style={{ padding: 15, paddingTop: 75, width: '100%' }}>
                        <Text style={{ fontSize: 25, color: '#a6a2a2', fontWeight: 'bold', fontFamily: 'inter' }}>
                            No cues found.
                        </Text>
                    </View>
            }
        </Animated.View >
    );
}

export default React.memo(CardsList, (prev, next) => {
    return _.isEqual(prev.cues, next.cues)
})


const styleObject = (channelId: any) => {
    return StyleSheet.create({
        screen: {
            flex: 1,
            paddingHorizontal: 15,
            width: Dimensions.get('window').width * 0.25,
        },
        margin: {
            height: '2.5%'
        },
        marginSmall: {
            height: '1.25%'
        },
        row: {
            flex: 1,
            flexDirection: 'row',
            display: 'flex',
        },
        col: {
            height: '100%',
            flex: 1,
        }
    })
}
