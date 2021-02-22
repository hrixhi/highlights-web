import React, { useState, useEffect } from 'react';
import { StyleSheet, Image, ScrollView, Dimensions } from 'react-native';
import { View, Text, TouchableOpacity } from '../components/Themed';
import useColorScheme from '../hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import _ from 'lodash'

const TopBar: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const colorScheme = useColorScheme();
    const styles: any = styleObject(props.channelId)
    const [hideExclaimation, setHideExclaimation] = useState(false)
    const unparsedCues: any[] = JSON.parse(JSON.stringify(props.cues))
    const [cues] = useState<any[]>(unparsedCues.reverse())
    const [filterChoice] = useState(props.channelFilterChoice)
    const [channelCategories, setChannelCategories] = useState([])

    useEffect(() => {
        const custom: any = {}
        const cat: any = []
        cues.map((cue) => {
            if (cue.customCategory && cue.customCategory !== '' && !custom[cue.customCategory]) {
                custom[cue.customCategory] = 'category'
            }
        })
        Object.keys(custom).map(key => {
            cat.push(key)
        })
        setChannelCategories(cat)
    }, [cues])

    // useEffect(() => {
    //     const interval = setInterval(() => {
    //         setHideExclaimation(exclaim => !exclaim);
    //     }, 750);
    //     return () => {
    //         clearInterval(interval);
    //     };
    // }, []);

    return (
        <View style={styles.topbar} key={Math.random()}>
            <View style={{ width: '100%', height: Dimensions.get('window').height * 0.17 * 0.2 }} />
            <View style={{ width: '100%', height: Dimensions.get('window').height * 0.17 * 0.69 }}>
                <View style={{ ...styles.header, paddingTop: 6 }}>
                    <Image
                        source={require('./default-images/cues-logo-black-exclamation-hidden.jpg')
                            // colorScheme === 'light' ?
                            // (
                            //     !hideExclaimation ? require('./default-images/cues-logo-black.jpg') : require('./default-images/cues-logo-black-exclamation-hidden.jpg')
                            // )
                            // :
                            // (
                            //     !hideExclaimation ? require('./default-images/cues-logo-white.jpg') : require('./default-images/cues-logo-white-exclamation-hidden.jpg')
                            // )
                        }
                        style={{
                            width: '17%',
                            height: Dimensions.get('window').height * 0.17 * 0.2
                        }}
                        resizeMode={'contain'}
                    />
                    <View
                        key={JSON.stringify(cues)}
                        style={{
                            width: '83%'
                        }}>
                        {
                            props.channelId !== '' ?
                                <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-end' }}>
                                    <TouchableOpacity
                                        style={{ paddingTop: 5, marginRight: 20 }}
                                        onPress={() => props.openDiscussion()}>
                                        <Text style={styles.channelText}>
                                            <Ionicons name='chatbubble-ellipses-outline' size={22} color={'#a6a2a2'} />
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{ paddingTop: 5, marginRight: 20 }}
                                        onPress={() => props.openSubscribers()}>
                                        <Text style={styles.channelText}>
                                            <Ionicons name='people-outline' size={22} color={'#a6a2a2'} />
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{ paddingTop: 5, marginRight: 5 }}
                                        onPress={() => props.unsubscribe()}>
                                        <Text style={styles.channelText}>
                                            <Ionicons name='exit-outline' size={22} color={'#a6a2a2'} />
                                        </Text>
                                    </TouchableOpacity>
                                </View> :
                                null
                        }
                    </View>
                </View>
                <View
                    key={JSON.stringify(cues) + JSON.stringify(filterChoice)}
                    style={{ width: '100%', height: '55%', paddingTop: 10 }}>
                    <ScrollView style={{
                        width: '98.5%',
                        paddingTop: 8
                    }} horizontal={true}
                        showsHorizontalScrollIndicator={false}
                    >
                        {
                            channelCategories.length === 0 ? null :
                                <TouchableOpacity
                                    style={filterChoice === 'All' ? { ...styles.sub, ...styles.subOutline } : styles.sub}
                                    onPress={() => props.setChannelFilterChoice('All')}>
                                    <Text
                                        style={{ color: '#a6a2a2', lineHeight: 20 }}
                                    >
                                        All
                                            </Text>
                                </TouchableOpacity>
                        }
                        {
                            channelCategories.map((category: string) => {
                                return <TouchableOpacity
                                    key={Math.random()}
                                    style={filterChoice === category ? { ...styles.sub, ...styles.subOutline } : styles.sub}
                                    onPress={() => props.setChannelFilterChoice(category)}>
                                    <Text
                                        style={{ color: '#a6a2a2', lineHeight: 20 }}>
                                        {category}
                                    </Text>
                                </TouchableOpacity>
                            })
                        }
                    </ScrollView>
                </View>
            </View>
        </View>
    );
}


export default React.memo(TopBar, (prev, next) => {
    return _.isEqual(prev.cues, next.cues) && _.isEqual(prev.channelFilterChoice, next.channelFilterChoice)
})

const styleObject: any = (channelId: any) => StyleSheet.create({
    topbar: {
        height: '16%',
        width: '100%',
        flexDirection: 'column',
        display: 'flex',
        paddingHorizontal: 15
    },
    padding: {
        height: Dimensions.get('window').height * 0.17 * 0.31,
        width: '100%'
    },
    header: {
        flexDirection: 'row',
        display: 'flex'
    },
    text: {
        textAlign: 'right',
        color: '#101010',
        fontWeight: 'bold',
        fontSize: 15,
        paddingRight: 15
    },
    subOutline: {
        borderRadius: 10,
        borderColor: '#a6a2a2',
        borderWidth: 1,
        height: 22
    },
    sub: {
        fontSize: 15,
        color: '#a6a2a2',
        height: 22,
        paddingHorizontal: 10,
        lineHeight: 20
    },
});
