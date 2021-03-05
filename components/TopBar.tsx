import React, { useState, useEffect } from 'react';
import { StyleSheet, Image, ScrollView, Dimensions, Linking } from 'react-native';
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
            <View style={{ width: '80%', height: Dimensions.get('window').height * 0.15 * 0.22, alignSelf: 'center' }} />
            <View style={{ width: '100%', height: Dimensions.get('window').height * 0.15 * 0.78 }}>
                <View style={{
                    flexDirection: 'row',
                    display: 'flex'
                }}>
                    <TouchableOpacity
                        onPress={() => Linking.openURL('http://www.cuesapp.co')}
                        style={{ backgroundColor: 'white' }}>
                        <Image
                            source={require('./default-images/cues-logo-black-exclamation-hidden.jpg')}
                            style={{
                                width: Dimensions.get('window').height * 0.16 * 0.53456,
                                height: Dimensions.get('window').height * 0.16 * 0.2
                            }}
                            resizeMode={'contain'}
                        />
                    </TouchableOpacity>
                    <View
                        key={JSON.stringify(cues)}
                        style={{
                            flex: 1, flexDirection: 'row'
                        }}>
                        {
                            props.channelId !== '' ?
                                <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-end' }}>
                                    <TouchableOpacity
                                        style={{ marginRight: 20 }}
                                        onPress={() => props.openDiscussion()}>
                                        <Text style={styles.channelText}>
                                            <Ionicons name='chatbubble-ellipses-outline' size={19} color={'#a6a2a2'} />
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{ marginRight: 20 }}
                                        onPress={() => props.openSubscribers()}>
                                        <Text style={styles.channelText}>
                                            <Ionicons name='people-outline' size={21} color={'#a6a2a2'} />
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{ marginRight: 20 }}
                                        onPress={() => props.openGrades()}>
                                        <Text style={styles.channelText}>
                                            <Ionicons name='newspaper-outline' size={19} color={'#a6a2a2'} />
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{ marginRight: 5 }}
                                        onPress={() => props.unsubscribe()}>
                                        <Text style={styles.channelText}>
                                            <Ionicons name='exit-outline' size={21} color={'#a6a2a2'} />
                                        </Text>
                                    </TouchableOpacity>
                                </View> :
                                <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-end' }}>
                                    <TouchableOpacity
                                        onPress={() => props.openWalkthrough()}
                                        style={{ marginRight: 5 }}
                                    >
                                        <Text style={styles.channelText}>
                                            <Ionicons name='help-circle-outline' size={21} color={'#a6a2a2'} />
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                        }
                    </View>
                </View>
                <View
                    key={JSON.stringify(cues) + JSON.stringify(filterChoice)}
                    style={{ width: '100%', height: '55%', paddingTop: 10 }}>
                    <ScrollView style={{
                        width: '98.5%',
                        paddingTop: 15
                    }} horizontal={true}
                        showsHorizontalScrollIndicator={false}
                    >
                        <TouchableOpacity
                            style={filterChoice === 'All' ? styles.subOutline : styles.sub}
                            onPress={() => props.setChannelFilterChoice('All')}>
                            <Text
                                style={{ color: '#a6a2a2', lineHeight: 20 }}
                            >
                                All
                                            </Text>
                        </TouchableOpacity>
                        {
                            channelCategories.map((category: string) => {
                                return <TouchableOpacity
                                    key={Math.random()}
                                    style={filterChoice === category ? styles.subOutline : styles.sub}
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
        height: '15%',
        width: '100%',
        flexDirection: 'column',
        display: 'flex',
        paddingHorizontal: 20,
        borderTopRightRadius: 30,
        borderTopLeftRadius: 30,
    },
    text: {
        textAlign: 'right',
        color: '#101010',
        fontWeight: 'bold',
        fontSize: 15,
        paddingRight: 15
    },
    subOutline: {
        fontSize: 15,
        color: '#a6a2a2',
        height: 22,
        paddingHorizontal: 10,
        lineHeight: 20,
        borderRadius: 10,
        borderColor: '#a6a2a2',
        borderWidth: 1
    },
    sub: {
        fontSize: 15,
        color: '#a6a2a2',
        height: 22,
        paddingHorizontal: 10,
        lineHeight: 20
    },
    channelText: {
        // paddingTop: 1
        lineHeight: 21
    }
});
