import React, { useState, useEffect } from 'react';
import { StyleSheet, Animated, Dimensions } from 'react-native';
import { Text, TouchableOpacity, View } from './Themed';
import Swiper from 'react-native-web-swiper'
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';

const Walkthrough: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [modalAnimation] = useState(new Animated.Value(0))
    useEffect(() => {
        Animated.timing(modalAnimation, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true
        }).start();
    }, [])

    const windowHeight = Dimensions.get('window').height;
    return (
        <View style={{
            width: '100%',
            height: windowHeight - 30,
            backgroundColor: '#fff',
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
        }}>
            <Animated.View style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'white',
                padding: 15,
                opacity: modalAnimation,
                borderTopLeftRadius: 30,
                borderTopRightRadius: 30,
                alignSelf: 'center'
            }}>
                <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 20 }}>
                    {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
                </Text>
                <Swiper
                    vertical={false}
                    from={0}
                    minDistanceForAction={0.1}
                    controlsProps={{
                        dotsTouchable: true,
                        prevPos: 'left',
                        nextPos: 'right',
                        nextTitle: '›',
                        nextTitleStyle: { color: '#a6a2a2', fontSize: 50, fontFamily: 'overpass' },
                        prevTitle: '‹',
                        prevTitleStyle: { color: '#a6a2a2', fontSize: 50, fontFamily: 'overpass' },
                        dotActiveStyle: { backgroundColor: '#0079fe' }
                    }}
                >
                    <View style={styles.screen} key={Math.random()}>
                        <Text style={{
                            color: '#101010',
                            textAlign: 'left',
                            fontSize: 30,
                            fontWeight: 'bold',
                            fontFamily: 'inter',
                            paddingTop: 50
                        }}>
                            Enhance note-taking. {'\n'}Simplify note-sharing.
                        </Text>
                        <Text style={{
                            color: '#a6a2a2',
                            textAlign: 'left',
                            fontSize: 20,
                            fontWeight: 'bold'
                        }}>
                            {'\n'}Remember useful content by playing it as recurring reminders.
                        </Text>
                        {/* <TouchableOpacity
                            onPress={() => Linking.openURL('http://www.cuesapp.co')}
                            style={{ backgroundColor: 'white' }}>
                            <Text style={{ color: '#0079fe', fontSize: 20, textAlign: 'left' }}>
                                {'\n'} www.cuesapp.co
                            </Text>
                        </TouchableOpacity> */}
                    </View>
                    <View style={styles.screen} key={Math.random()}>
                        <Text style={{
                            color: '#101010',
                            textAlign: 'left',
                            fontSize: 30,
                            fontFamily: 'inter',
                            fontWeight: 'bold',
                            paddingTop: 50
                        }}>
                            Click <Ionicons name='add-circle' size={23} /> to create a new cue.
                        </Text>
                        <Text style={{
                            color: '#a6a2a2',
                            textAlign: 'left',
                            fontSize: 20,
                            fontWeight: 'bold'
                        }}>
                            {'\n'}List by priority and organise by category.
                        </Text>
                    </View>
                    <View style={styles.screen} key={Math.random()}>
                        <Text style={{
                            color: '#101010',
                            textAlign: 'left',
                            fontSize: 30,
                            fontWeight: 'bold',
                            fontFamily: 'inter',
                            paddingTop: 50
                        }}>
                            Click <Ionicons name='notifications-outline' size={23} color={'#101010'} /> to play a cue as a recurring reminder.
                        </Text>
                        <Text style={{
                            color: '#a6a2a2',
                            textAlign: 'left',
                            fontSize: 20,
                            fontWeight: 'bold'
                        }}>
                            {'\n'}Use <Ionicons name='shuffle-outline' size={20} color={'#a6a2a2'} /> and <Ionicons name='infinite-outline' size={20} color={'#a6a2a2'} /> for reminder settings.
                        </Text>
                    </View>
                    <View style={styles.screen} key={Math.random()}>
                        <Text style={{
                            color: '#101010',
                            textAlign: 'left',
                            fontSize: 30,
                            fontFamily: 'inter',
                            fontWeight: 'bold',
                            paddingTop: 50
                        }}>
                            Click <Ionicons name='settings-outline' size={23} /> to choose how often a shuffled cue is played.
                        </Text>
                        <Text style={{
                            color: '#a6a2a2',
                            textAlign: 'left',
                            fontSize: 20,
                            fontWeight: 'bold'
                        }}>
                            {'\n'}View high priority cues more frequently when on shuffle.
                        </Text>
                    </View>
                    <View style={styles.screen} key={Math.random()}>
                        <Text style={{
                            color: '#101010',
                            textAlign: 'left',
                            fontSize: 30,
                            fontFamily: 'inter',
                            fontWeight: 'bold',
                            paddingTop: 50
                        }}>
                            Click <Ionicons name='add-outline' size={23} color='#0079fe' /> to create or subscribe to a channel.
                        </Text>
                        <Text style={{
                            color: '#a6a2a2',
                            textAlign: 'left',
                            fontSize: 20,
                            fontWeight: 'bold'
                        }}>
                            {'\n'}Share and discuss cues over a channel. Subscribers can access all shared content, comment on a cue and use the general discussion.
                        </Text>
                    </View>
                    <View style={styles.screen} key={Math.random()}>
                        <Text style={{
                            color: '#101010',
                            textAlign: 'left',
                            fontSize: 30,
                            fontWeight: 'bold',
                            fontFamily: 'inter',
                            paddingTop: 50
                        }}>
                            Stay connected to what matters to you.
                        </Text>
                        <Text style={{
                            color: '#a6a2a2',
                            textAlign: 'left',
                            fontSize: 20,
                            fontWeight: 'bold'
                        }}>
                            {'\n'}Keep track of the ideas & actions that can make a difference in your life.
                    </Text>
                    </View>
                </Swiper>
            </Animated.View>
        </View >
    );
}

export default Walkthrough;

const styles = StyleSheet.create({
    screen: {
        backgroundColor: 'white',
        height: '100%',
        width: '60%',
        alignSelf: 'center',
        borderTopRightRadius: 30,
        borderTopLeftRadius: 30,
    },
});