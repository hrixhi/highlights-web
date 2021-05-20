import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Animated, Dimensions, Switch } from 'react-native';
import { Text, View } from './Themed';
import Swiper from 'react-native-web-swiper'
import AsyncStorage from '@react-native-async-storage/async-storage';
import YoutubePlayer from "react-native-youtube-iframe";
import MessengerCustomerChat from 'react-messenger-customer-chat';
import { LanguageSelect } from "../helpers/LanguageContext";

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
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
        }}>
            <Animated.View
                style={{
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
                <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: 50 }}>
                    <Text
                        style={{
                            paddingTop: 25,
                            flex: 1,
                            textAlign: 'center',
                            fontSize: 25,
                            color: "#202025",
                            fontFamily: "inter",
                        }}
                        ellipsizeMode="tail">
                        Walkthrough
                    </Text>
                </View>
                <View
                    style={{
                        paddingHorizontal: Dimensions.get('window').width < 768 ? 0 : 100,
                        width: '100%',
                        height: 50,
                        backgroundColor: 'white',
                        flexDirection: 'row'
                    }}>
                    <View style={{ flex: 1 }}>
                        <Text
                            style={{ color: '#202025', fontSize: 17, flex: 1, lineHeight: 25 }}
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
                                Instructor
                        </Text>
                        </View>
                    </View>
                </View>
                <Swiper
                    key={isInstructor.toString()}
                    onIndexChanged={(ind) => {
                        setIndex(ind)
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
                <View style={{ width: '100%', display: 'flex', alignItems: 'flex-start'}}>
                    <LanguageSelect />
                </View>
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
        width: Dimensions.get('window').width < 1024 ? '100%' : '80%',
        alignSelf: 'center',
        borderTopRightRadius: 30,
        borderTopLeftRadius: 30,
        zIndex: -1,
    },
});