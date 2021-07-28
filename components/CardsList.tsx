import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Animated, Dimensions } from 'react-native';
import Alert from '../components/Alert'
import { Text, View } from '../components/Themed';
import Card from './Card'
import _ from 'lodash'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScrollView } from 'react-native-gesture-handler';
import { PreferredLanguageText } from '../helpers/LanguageContext';

const CardsList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const window = Dimensions.get("window");
    const screen = Dimensions.get("screen");

    const [dimensions, setDimensions] = useState({ window, screen });

    const unparsedCues: any[] = JSON.parse(JSON.stringify(props.cues))
    const [cues] = useState<any[]>(unparsedCues.reverse())
    const [filterChoice] = useState(props.channelFilterChoice)
    let filteredCues: any[] = []
    if (filterChoice === 'All') {
        filteredCues = cues
    } else {
        filteredCues = cues.filter((cue) => {
            return cue.customCategory === filterChoice
        })
    }
    const styles = styleObject(props.channelId)

    const clickPlusAndSelectAlert = PreferredLanguageText('clickPlusAndSelect');

    const noChannelCuesAlert = useCallback(async () => {
    }, [props.channelId, props.createdBy, cues])

    const onDimensionsChange = useCallback(({ window, screen }: any) => {
        // window.location.reload()
        setDimensions({ window, screen })
    }, []);

    useEffect(() => {
        Dimensions.addEventListener("change", onDimensionsChange);
        return () => {
            Dimensions.removeEventListener("change", onDimensionsChange);
        };
    }, [])

    useEffect(() => {
        noChannelCuesAlert()
    }, [])

    return (
        <Animated.View style={{
            borderColor: '#f4f4f6',
            backgroundColor: '#2F2F3C',
            // borderBottomWidth: 2,
            // borderTopWidth: 1,
            height: ((dimensions.window.height) * 0.66),
            opacity: props.fadeAnimation,
            width: dimensions.window.width < 1024 ? dimensions.window.width : dimensions.window.width * 0.3,
            paddingHorizontal: 25,
            // paddingTop: 15
        }}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                horizontal={false}
                contentContainerStyle={{
                    backgroundColor: '#2F2F3C',
                    width: dimensions.window.width < 1024 ? dimensions.window.width - 50 : (dimensions.window.width * 0.3 - 50),
                    height: dimensions.window.width < 1024 ? '100%' : (((dimensions.window.height) * 0.7) - 2),
                }}
                style={{ paddingBottom: 15 }}
            >
                {/* <View style={styles.marginSmall} /> */}
                {
                    filteredCues.map((cue: any, index: number) => {
                        return <View style={{ height: 70, marginBottom: 15, maxWidth: 500, backgroundColor: '#2F2F3C', alignSelf: 'center', width: '100%' }} key={index}>
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
                                subscriptions={props.subscriptions}
                            />
                        </View>
                    })
                }
                {
                    filteredCues.length === 0 ? <Text style={{ fontSize: 20, color: '#a2a2ac', textAlign: 'center', fontFamily: 'inter', backgroundColor: '#2F2F3C' }}>
                        {PreferredLanguageText('noCuesCreated')}
                    </Text> : null
                }
                <View style={{ height: 15, backgroundColor: '#2F2F3C' }} />
            </ScrollView>
        </Animated.View >
    );
}

export default CardsList;

// export default React.memo(CardsList, (prev, next) => {
//     return _.isEqual(prev.cues, next.cues)
// })

const styleObject = (channelId: any) => {
    return StyleSheet.create({
        screen: {
            height: '100%',
            width: Dimensions.get('window').width < 1024 ? Dimensions.get('window').width : Dimensions.get('window').width * 0.3 - 36
        },
        margin: {
            height: '2.5%'
        },
        marginSmall: {
            height: '1.25%'
        },
        page: {
            flexDirection: 'column',
        },
        badge: {
            position: 'absolute',
            alignSelf: 'flex-end',
            width: 20,
            height: 20,
            marginTop: -2,
            borderRadius: 10,
            backgroundColor: '#d91d56',
            textAlign: 'center',
            zIndex: 50
        },
        blueBadge: {
            position: 'absolute',
            alignSelf: 'flex-end',
            width: 20,
            marginRight: 25,
            height: 20,
            marginTop: -2,
            borderRadius: 10,
            backgroundColor: '#3B64F8',
            textAlign: 'center',
            zIndex: 50
        },
    })
}
