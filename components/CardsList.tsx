import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Animated, Dimensions } from 'react-native';
import Alert from '../components/Alert'
import { View } from '../components/Themed';
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
                        Alert("Click + and select this channel to broadcast a cue.")
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
            height: (Dimensions.get('window').height - 30) * 0.7,
            opacity: props.fadeAnimation,
            width: Dimensions.get('window').width < 1024 ? Dimensions.get('window').width : Dimensions.get('window').width * 0.3,
            paddingHorizontal: 20
        }}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                horizontal={false}
                contentContainerStyle={{
                    width: Dimensions.get('window').width < 1024 ? Dimensions.get('window').width - 40 : (Dimensions.get('window').width * 0.3 - 70),
                    height: Dimensions.get('window').width < 1024 ? '100%' : ((Dimensions.get('window').height - 30) * 0.7),
                }}
            >
                <View style={styles.marginSmall} />
                {
                    filteredCues.map((cue: any, index: number) => {
                        return <View style={{ height: '20%', marginBottom: '2.5%' }} key={index}>
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
                        </View>
                    })
                }
                <View style={styles.marginSmall} />
            </ScrollView>
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
            width: Dimensions.get('window').width < 1024 ? Dimensions.get('window').width : Dimensions.get('window').width * 0.3 - 40
        },
        margin: {
            height: '2.5%'
        },
        marginSmall: {
            height: '1.25%'
        },
        page: {
            flexDirection: 'column',
        }
    })
}
