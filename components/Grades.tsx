import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions } from 'react-native';
import Alert from '../components/Alert'
import { View, Text, TouchableOpacity } from './Themed';
import { ScrollView } from 'react-native-gesture-handler'
import { fetchAPI } from '../graphql/FetchAPI';
import { getGrades, getGradesList, getSubmissionStatistics } from '../graphql/QueriesAndMutations';
import GradesList from './GradesList';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import { htmlStringParser } from '../helpers/HTMLParser';
import { Ionicons } from '@expo/vector-icons';


const Grades: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [modalAnimation] = useState(new Animated.Value(1))
    const [loading, setLoading] = useState(true)
    const [cues, setCues] = useState<any[]>([])
    const [scores, setScores] = useState<any[]>([])
    const [submissionStatistics, setSubmissionStatistics] = useState<any[]>([])
    const [viewStatisticsCue, setViewStatisticsCue] = useState<any>({})

    const couldNotLoadSubscribersAlert = PreferredLanguageText('couldNotLoadSubscribers');
    const checkConnectionAlert = PreferredLanguageText('checkConnection');

    const loadCuesAndScores = useCallback(() => {
        setLoading(true)
        if (props.channelId && props.channelId !== '') {
            const server = fetchAPI('')
            server.query({
                query: getGrades,
                variables: {
                    channelId: props.channelId
                }
            })
                .then(res => {
                    if (res.data.channel && res.data.channel.getSubmissionCues) {
                        setCues(res.data.channel.getSubmissionCues)
                        server.query({
                            query: getGradesList,
                            variables: {
                                channelId: props.channelId
                            }
                        }).then(async (res2) => {
                            if (res2.data.channel.getGrades) {
                                const u = await AsyncStorage.getItem('user')
                                if (u) {
                                    const user = JSON.parse(u)
                                    if (user._id.toString().trim() === props.channelCreatedBy.toString().trim()) {
                                        // all scores
                                        setScores(res2.data.channel.getGrades)
                                    } else {
                                        // only user's score
                                        const score = res2.data.channel.getGrades.find((u: any) => {
                                            return u.userId.toString().trim() === user._id.toString().trim()
                                        })
                                        const singleScoreArray = [{ ...score }]
                                        setScores(singleScoreArray)
                                    }

                                }
                                setLoading(false)
                                modalAnimation.setValue(0)
                                Animated.timing(modalAnimation, {
                                    toValue: 1,
                                    duration: 150,
                                    useNativeDriver: true
                                }).start();
                            }
                        }).catch(err => {
                            Alert(couldNotLoadSubscribersAlert, checkConnectionAlert);
                            setLoading(false)
                            modalAnimation.setValue(0)
                            Animated.timing(modalAnimation, {
                                toValue: 1,
                                duration: 150,
                                useNativeDriver: true
                            }).start();
                        })
                    } else {
                        setLoading(false)
                        modalAnimation.setValue(0)
                        Animated.timing(modalAnimation, {
                            toValue: 1,
                            duration: 150,
                            useNativeDriver: true
                        }).start();
                    }
                })
                .catch((err) => {
                    Alert(couldNotLoadSubscribersAlert, checkConnectionAlert);
                    setLoading(false)
                    modalAnimation.setValue(0)
                    Animated.timing(modalAnimation, {
                        toValue: 1,
                        duration: 150,
                        useNativeDriver: true
                    }).start();
                })
        } else {
            setLoading(false)
            modalAnimation.setValue(0)
            Animated.timing(modalAnimation, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true
            }).start();
        }
    }, [props.channelId, modalAnimation, props.channelCreatedBy])

    const loadSubmissionStatistics = useCallback(() => {

        if (props.channelId && props.channelId !== '') {
            const server = fetchAPI('')
            server.query({
                query: getSubmissionStatistics,
                variables: {
                    channelId: props.channelId
                }
            }).then(res => {
                if (res.data.channel && res.data.channel.getSubmissionCuesStatistics) {
                    setSubmissionStatistics(res.data.channel.getSubmissionCuesStatistics)
                }
            })

        }

    }, [props.channelId, modalAnimation, props.channelCreatedBy])

    useEffect(() => {
        loadCuesAndScores()
        loadSubmissionStatistics()
    }, [props.channelId])

    const renderCueStatistics = () => {
        
        const filteredCue = submissionStatistics.filter(stat => stat.cueId === viewStatisticsCue._id);

        let selectedCueStatistic = {};

        if (filteredCue.length > 0) {
            selectedCueStatistic = filteredCue[0];
        }

        const { title } = htmlStringParser(viewStatisticsCue.cue)

        const statisticsValues = ["max", "min", "mean", "median", "std",];
        const statisticsLabels = ["Max", "Min", "Mean", "Median", "Std dev"]
        const statisticsUnit = ["%", "%", "%", "%", "%" ]

        return (<View style={{
            width: '100%',
            paddingTop: 50,
            paddingHorizontal: 30,
            paddingLeft: 10
        }}>
            <View style={{ flexDirection: 'column' }}>
             <TouchableOpacity
                key={Math.random()}
                style={{
                        flex: 1,
                        backgroundColor: 'white'
                    }}
                        onPress={() => {
                            setViewStatisticsCue({})
                        }}>
                        <Text style={{
                            width: '100%',
                            fontSize: 15,                                
                            color: '#a2a2aa'
                        }}>
                            <Ionicons name='chevron-back-outline' size={17} color={'#202025'} style={{ marginRight: 10, }} /> Grades 
                        </Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row',  paddingTop: 50, width: '100%' }}>
                <Text style={{ fontSize: 25, borderRadius: 15, marginRight: 30, padding: 10 }}>
                    {title}
                </Text>

                <Text style={{ backgroundColor: '#3B64F8', color: 'white', fontSize: 25, padding: 10, borderRadius: 10, textAlign: 'right' }}>
                    Submissions: {selectedCueStatistic && selectedCueStatistic.submissionCount > 0 ? selectedCueStatistic.submissionCount - 1 : 0 }
                </Text>
            </View>
           
            </View>

            {selectedCueStatistic ? <View style={{  paddingTop: 50, flexDirection: 'row', }}>
                {statisticsValues.map((stat, index) => {
                    return <View style={{ paddingLeft: 10, paddingVertical: 20, width: '20%' }}>
                        <Text style={{ fontSize: 15, textTransform: 'uppercase', }}>
                            {statisticsLabels[index]}
                        </Text>
                        <Text style={{ paddingTop: 20, fontSize: 25, fontWeight: 'bold'  }}>
                            {selectedCueStatistic[stat]} {statisticsUnit[index]}
                        </Text>
                    </View>

                })}
            </View> 
            :
            <View style={{ backgroundColor: 'white', flex: 1 }}>
                <Text style={{ width: '100%', color: '#a2a2aa', fontSize: 25, paddingTop: 50, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                    No data available.                    
                </Text>                    
            </View>}
        </View>)
    }

    const windowHeight = Dimensions.get('window').width < 1024 ? Dimensions.get('window').height - 30 : Dimensions.get('window').height;
    return (
        <ScrollView style={{
            width: '100%',
            height: windowHeight,
            backgroundColor: 'white',
            borderTopRightRadius: 0,
            borderTopLeftRadius: 0
        }}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            scrollEventThrottle={1}
            keyboardDismissMode={'on-drag'}
            overScrollMode={'always'}
            nestedScrollEnabled={true}
        >
            <Animated.View style={{
                opacity: modalAnimation,
                width: '100%',
                height: windowHeight,
                backgroundColor: 'white',
                borderTopRightRadius: 0,
                borderTopLeftRadius: 0
            }}>
                {
                    loading
                        ? <View style={{
                            width: '100%',
                            flex: 1,
                            justifyContent: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: 'white',
                            borderTopRightRadius: 0,
                            borderTopLeftRadius: 0
                        }}>
                            <ActivityIndicator color={'#a2a2aa'} />
                        </View>
                        :
                        (Object.keys(viewStatisticsCue).length > 0
                        ? 
                        renderCueStatistics() 
                        : <GradesList
                            key={JSON.stringify(scores)}
                            scores={scores}
                            cues={cues}
                            channelName={props.filterChoice}
                            channelId={props.channelId}
                            closeModal={() => {
                                Animated.timing(modalAnimation, {
                                    toValue: 0,
                                    duration: 150,
                                    useNativeDriver: true
                                }).start(() => props.closeModal())
                            }}
                            reload={() => loadCuesAndScores()}
                            onSelectSubmission={(cue: any) => setViewStatisticsCue(cue)}
                        />)
                }
            </Animated.View>
        </ScrollView>
    );
}

export default Grades