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

    const categoryMap: any = { '': [] }

    filteredCues.map((cue: any) => {
        if (!categoryMap[cue.customCategory]) {
            categoryMap[cue.customCategory] = 1
        }
    })

    return (
        <Animated.View style={{
            borderColor: '#FBFBFC',
            backgroundColor: '#FBFBFC',
            // borderBottomWidth: 2,
            // borderTopWidth: 1,
            height: ((dimensions.window.height) * (0.83)),
            opacity: props.fadeAnimation,
            width: dimensions.window.width,
            paddingHorizontal: dimensions.window.width < 768 ? 20 : 40,
            // paddingTop: 15
        }}>
            <ScrollView
                horizontal={true}
                style={{ width: '100%', backgroundColor: '#fbfbfc', paddingTop: 20 }}
            >
                {
                    Object.keys(categoryMap).map((category: any, i: any) => {
                        return <View style={{
                            width: '100%',
                            maxWidth: 300,
                            backgroundColor: '#fbfbfc',
                            marginRight: 25
                        }}>
                            <View style={{ backgroundColor: '#fbfbfc', paddingLeft: 23, marginBottom: 20 }}>
                                <Text style={{
                                    flex: 1, flexDirection: 'row',
                                    color: '#818385',
                                    fontSize: 20, lineHeight: 25,
                                    fontFamily: 'inter'
                                }} ellipsizeMode='tail'>
                                    {category === '' ? 'None' : category}
                                </Text>
                            </View>
                            <View
                                // showsVerticalScrollIndicator={false}
                                // horizontal={true}
                                // style={{ height: '100%' }}
                                style={{
                                    // borderWidth: 1,
                                    backgroundColor: '#fbfbfc'
                                    // height: 190
                                }}
                                key={i.toString()}
                            >
                                {filteredCues.map((cue: any, index: any) => {
                                    if (cue.customCategory.toString().trim() !== category.toString().trim()) {
                                        return null
                                    }
                                    return <View style={{
                                        // height: 150,
                                        marginBottom: 20,
                                        // marginBottom: i === priorities.length - 1 ? 0 : 20,
                                        // maxWidth: 150,
                                        backgroundColor: '#fbfbfc',
                                        width: '100%'
                                    }}
                                        key={index}
                                    >
                                        <Card
                                            // gray={true}
                                            fadeAnimation={props.fadeAnimation}
                                            updateModal={() => {
                                                props.openUpdate(
                                                    cue.key,
                                                    cue.index,
                                                    0,
                                                    cue._id,
                                                    (cue.createdBy ? cue.createdBy : ''),
                                                    (cue.channelId ? cue.channelId : '')
                                                )
                                            }}
                                            cue={cue}
                                            channelId={props.channelId}
                                            subscriptions={props.subscriptions}
                                        />
                                    </View>
                                })}
                            </View>
                        </View>
                    })
                }
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
            borderRadius: 12,
            backgroundColor: '#f94144',
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
            borderRadius: 12,
            backgroundColor: '#560bad',
            textAlign: 'center',
            zIndex: 50
        },
    })
}
