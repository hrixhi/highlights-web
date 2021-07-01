import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Animated, Dimensions, Switch } from 'react-native';
import { Text, View } from './Themed';
import Swiper from 'react-native-web-swiper'
import AsyncStorage from '@react-native-async-storage/async-storage';
import YoutubePlayer from "react-native-youtube-iframe";
import MessengerCustomerChat from 'react-messenger-customer-chat';

const Walkthrough: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [modalAnimation] = useState(new Animated.Value(0))
    const [isInstructor, setIsInstructor] = useState(false)
    const [index, setIndex] = useState(0)

    const loadIsInstructor = useCallback(async () => {
        const choice = await AsyncStorage.getItem("isInstructor")
        if (choice) {
            setIsInstructor(choice === 'false' ? false : true)
        } else {
            await AsyncStorage.setItem("isInstructor", "false")
        }
    }, [])

    useEffect(() => {
        loadIsInstructor()
        Animated.timing(modalAnimation, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true
        }).start();
    }, [])

    const headings: any[] = ["Introduction", "Working with Content", "Meetings", "Text-based Communication", "Testing & Grading", "Miscellaneous"]
    const windowHeight = Dimensions.get('window').width < 1024 ? Dimensions.get('window').height - 30 : Dimensions.get('window').height;

    return (
        <View style={{
            width: '100%',
            height: windowHeight,
            backgroundColor: '#fff',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
        }}>
            <Animated.View
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'white',
                    paddingHorizontal: 20,
                    opacity: modalAnimation,
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0
                }}>
                <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 10 }}>
                    {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
                </Text>
                <View style={{ backgroundColor: 'white', paddingTop: 10 }}>
                    <Text
                        style={{
                            fontSize: 11,
                            paddingBottom: 20,
                            textTransform: "uppercase",
                            // paddingLeft: 10,
                            flex: 1,
                            lineHeight: 25
                        }}
                        ellipsizeMode="tail">
                        Walkthrough
                    </Text>
                    <Text style={{ paddingTop: 0, paddingBottom: 20, fontSize: 13, color: '#a2a2a2' }}>
                        Reach out to us using the blue Messenger icon.
                    </Text>
                </View>
                <View
                    style={{
                        width: '100%',
                        maxWidth: 500,
                        //height: 50,
                        paddingLeft: 55,
                        paddingTop: 20,
                        backgroundColor: 'white',
                        // flexDirection: 'row'
                    }}>
                    <View style={{ flex: 1 }}>
                        <Text
                            style={{ color: '#202025', fontSize: 15, flex: 1, lineHeight: 25 }}
                        >
                            {headings[index]}
                        </Text>
                    </View>
                    <View style={{ backgroundColor: 'white' }}>
                        <View style={{ flexDirection: 'row' }}>
                            <View style={{
                                backgroundColor: 'white',
                                height: 40,
                                marginRight: 10
                            }}>
                                <Switch
                                    value={isInstructor}
                                    onValueChange={async () => {
                                        const updatedVal = !isInstructor;
                                        await AsyncStorage.setItem("isInstructor", updatedVal.toString())
                                        setIsInstructor(updatedVal)
                                    }}
                                    style={{ height: 20 }}
                                    trackColor={{
                                        false: '#f4f4f6',
                                        true: '#a2a2aa'
                                    }}
                                    activeThumbColor='white'
                                />
                            </View>
                            <Text style={{
                                fontSize: 14,
                                color: '#a2a2aa',
                                textAlign: 'left',
                                paddingTop: 2
                            }}>
                                For Instructor
                            </Text>
                        </View>
                    </View>
                </View>
                <Swiper
                    key={isInstructor.toString()}
                    onIndexChanged={(ind) => {
                        setIndex(ind)
                    }}
                    containerStyle={{
                        width: '100%',
                        maxWidth: 700,
                        height: '100%',
                        maxHeight: 400
                    }}
                    vertical={false}
                    from={index}
                    minDistanceForAction={0.1}
                    controlsProps={{
                        dotsTouchable: true,
                        prevPos: 'left',
                        nextPos: 'right',
                        nextTitle: '›',
                        nextTitleStyle: { color: '#a2a2aa', fontSize: 60, fontFamily: 'overpass' },
                        prevTitle: '‹',
                        prevTitleStyle: { color: '#a2a2aa', fontSize: 60, fontFamily: 'overpass' },
                        dotActiveStyle: { backgroundColor: '#3B64F8' }
                    }}
                >
                    {/* Introduction */}
                    <View style={styles.screen} key={Math.random()}>
                        <YoutubePlayer
                            height={windowHeight - 100}
                            videoId={isInstructor ? "hQYMW3nvP-w" : "t-XBYlugTz8"}
                        />
                    </View>
                    {/* Working with Content */}
                    <View style={styles.screen} key={Math.random()}>
                        <YoutubePlayer
                            height={windowHeight - 100}
                            videoId={isInstructor ? "XwZRc4TLaRI" : "kkcAXw30xvk"}
                        />
                    </View>
                    {/* Meetings */}
                    <View style={styles.screen} key={Math.random()}>
                        <YoutubePlayer
                            height={windowHeight - 100}
                            videoId={isInstructor ? "i4L0eJE7DVI" : "S_AaSO0Qcq4"}
                        />
                    </View>
                    {/* Text-based Communication */}
                    <View style={styles.screen} key={Math.random()}>
                        <YoutubePlayer
                            height={windowHeight - 100}
                            videoId={isInstructor ? "0zYHoTEYwSs" : "vIy-kIg2DgM"}
                        />
                    </View>
                    {/* Testing & Grading */}
                    <View style={styles.screen} key={Math.random()}>
                        <YoutubePlayer
                            height={windowHeight - 100}
                            videoId={isInstructor ? "uUB9rux8N6w" : "wmS8N2LczaA"}
                        />
                    </View>
                    {/* Miscellaneous */}
                    <View style={styles.screen} key={Math.random()}>
                        <YoutubePlayer
                            height={windowHeight - 100}
                            videoId={isInstructor ? "R3W5_f0-VqI" : "S8N5w6uwD-8"}
                        />
                    </View>
                </Swiper>
            </Animated.View>
            <MessengerCustomerChat pageId="109965671259610" appId="746023139417168" themeColor="#3B64F8" />
        </View >
    );
}

export default Walkthrough;

const styles = StyleSheet.create({
    screen: {
        backgroundColor: 'white',
        height: '100%',
        width: '100%',
        maxWidth: 700,
        paddingHorizontal: 50,
        // alignSelf: 'center',
        borderTopRightRadius: 0,
        borderTopLeftRadius: 0,
        zIndex: -1,
    },
});