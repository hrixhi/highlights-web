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
                        nextTitleStyle: { color: '#a6a2a2', fontSize: 60, fontFamily: 'overpass' },
                        prevTitle: '‹',
                        prevTitleStyle: { color: '#a6a2a2', fontSize: 60, fontFamily: 'overpass' },
                        dotActiveStyle: { backgroundColor: '#0079fe' }
                    }}
                >
                    <View style={styles.screen} key={Math.random()}>
                        <Text style={{
                            color: '#101010',
                            textAlign: 'left',
                            fontSize: 30,
                            fontFamily: 'inter',
                            paddingTop: 50
                        }}>
                            Create, import and share classroom material.
                        </Text>
                        <Text style={{
                            color: '#a6a2a2',
                            textAlign: 'left',
                            fontSize: 20,
                            
                        }}>
                            {'\n'}Organise coursework (pdf, docx, pptx, xlsx...) by category & priority, whether it be lecture slides, class notes, homeworks or announcements.
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
                            paddingTop: 50
                        }}>
                            Directly work with content.
                        </Text>
                        <Text style={{
                            color: '#a6a2a2',
                            textAlign: 'left',
                            fontSize: 20,
                            
                        }}>
                            {'\n'}Let students view coursework, take notes on it and save changes to the cloud.
                        </Text>
                    </View>
                    <View style={styles.screen} key={Math.random()}>
                        <Text style={{
                            color: '#101010',
                            textAlign: 'left',
                            fontSize: 30,
                            fontFamily: 'inter',
                            paddingTop: 50
                        }}>
                            Streamline classroom communication.
                        </Text>
                        <Text style={{
                            color: '#a6a2a2',
                            textAlign: 'left',
                            fontSize: 20,
                            
                        }}>
                            {'\n'}Discuss content individually as comments, host general Q&A in discussion and direct message students.
                        </Text>
                    </View>
                    <View style={styles.screen} key={Math.random()}>
                        <Text style={{
                            color: '#101010',
                            textAlign: 'left',
                            fontFamily: 'inter',
                            paddingTop: 50
                        }}>
                            Simplify testing & grading.
                        </Text>
                        <Text style={{
                            color: '#a6a2a2',
                            textAlign: 'left',
                            fontSize: 20,
                            
                        }}>
                            {'\n'}Accept submissions, check for plagiarism, grade assignments and easily monitor overall performance.
                        </Text>
                    </View>
                    <View style={styles.screen} key={Math.random()}>
                        <Text style={{
                            color: '#101010',
                            textAlign: 'left',
                            fontSize: 30,
                            fontFamily: 'inter',
                            paddingTop: 50
                        }}>
                            Boost productivity.
                        </Text>
                        <Text style={{
                            color: '#a6a2a2',
                            textAlign: 'left',
                            fontSize: 20,
                            
                        }}>
                            {'\n'}Use in-built reminders to keep track of important tasks and deadlines.
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
        width: Dimensions.get('window').width < 1024 ? '100%' : '60%',
        paddingHorizontal: Dimensions.get('window').width < 1024 ? 20 : 0,
        alignSelf: 'center',
        borderTopRightRadius: 30,
        borderTopLeftRadius: 30,
    },
});