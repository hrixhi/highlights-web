import React, { useState, useEffect } from 'react';
import { Dimensions, ScrollView, StyleSheet } from 'react-native';
import { Text, View } from '../components/Themed';
import _ from 'lodash'
import { fetchAPI } from '../graphql/FetchAPI';
import { getPerformanceReport } from '../graphql/QueriesAndMutations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScoreCard from './ScoreCard';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import Chart from 'react-google-charts';
import { Ionicons } from '@expo/vector-icons';

const Performance: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [scores, setScores] = useState<any[]>([])
    const styleObject = styles();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        (
            async () => {
                const u = await AsyncStorage.getItem('user')
                if (u) {
                    const user = JSON.parse(u)
                    const server = fetchAPI(user._id)
                    server.query({
                        query: getPerformanceReport,
                        variables: {
                            userId: user._id
                        }
                    }).then(res => {
                        if (res.data && res.data.user.getPerformanceReport) {
                            setScores(res.data.user.getPerformanceReport)
                            setLoading(false)
                        }
                    }).catch(err => {
                        setLoading(false)
                    })
                }
            }
        )()
    }, [])

    const width = Dimensions.get("window").width;
    const windowHeight =
        width < 1024 ? Dimensions.get("window").height - 30 : Dimensions.get("window").height;

    const data = [["Channel", "Your Score", "Total Score"]];
    scores.map((score: any) => {
        data.push([score.channelName, Number(score.score) / Number(score.total), Number(score.total) - Number(score.score) / Number(score.total)])
    })

    const chartConfig = {
        backgroundColor: '#000000',
        backgroundGradientFrom: '#1E2923',
        backgroundGradientTo: '#08130D',
        fontFamily: "inter",
        color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
        style: {
            borderRadius: 16,
        },
        propsForLabels: {
            fontFamily: 'overpass; Arial',
        },
    }

    return <View style={{
        width: "100%",
        height: windowHeight - 85,
        backgroundColor: "white",
        borderTopRightRadius: 0,
        borderTopLeftRadius: 0,
        flexDirection: width < 768 ? 'column' : 'row',
        paddingTop: 30
    }}>
        <View style={{ width: width < 768 ? '100%' : '50%', paddingRight: 30, borderRightWidth: width < 768 ? 0 : 1, borderColor: '#eeeeee' }}>
            <Text style={{
                marginRight: 10,
                color: '#3b64f8',
                fontSize: 25,
                paddingBottom: width < 768 ? 0 : 40,
                fontFamily: 'inter',
                // flex: 1,
                lineHeight: 25,
                height: width < 768 ? 30 : 65,
            }}>
                <Ionicons name='stats-chart-outline' size={25} color='#3b64f8' /> Overview
            </Text>
            <ScrollView
                horizontal={true}
            >

            </ScrollView>
        </View>
        <View style={{ width: width < 768 ? '100%' : '50%', paddingLeft: width < 768 ? 0 : 30 }}>
            <Text style={{
                marginRight: 10,
                color: '#2f2f3c',
                fontSize: 25,
                paddingBottom: 20,
                fontFamily: 'inter',
                // flex: 1,
                lineHeight: 25,
                // height: 65
            }}>
                <Ionicons name='medal-outline' size={25} color='#2f2f3c' /> Scores
            </Text>
            <ScrollView
                showsVerticalScrollIndicator={false}
                horizontal={false}
                nestedScrollEnabled={true}
                // style={{ height: '100%' }}
                contentContainerStyle={{
                    // borderWidth: 2,
                    width: '100%',
                }}
            >
                {
                    scores.length > 0 ?
                        <ScrollView
                            horizontal={true}
                        >
                            <Chart
                                style={{ minHeight: 400, minWidth: 400 }}
                                chartType="BarChart"
                                loader={<div>Loading Chart</div>}
                                data={data}
                                options={{
                                    // Material design options
                                    fontName: 'overpass',
                                    chartArea: { width: '70%' },
                                    isStacked: true,
                                    hAxis: {
                                        title: 'Scores',
                                        minValue: 0,
                                        maxValue: 100
                                    },
                                    vAxis: {
                                        title: 'Channel',
                                    },
                                }}
                            />
                        </ScrollView> : (loading ? null :
                            <Text style={{ fontSize: 15, color: '#818385', textAlign: 'center', fontFamily: 'inter', backgroundColor: '#fff' }}>
                                {PreferredLanguageText('noCuesCreated')}
                            </Text>)
                }
                {
                    scores.map((sc: any, index) => {
                        return <View style={styleObject.col} key={index}>
                            <ScoreCard
                                score={sc}
                                onPress={props.onPress}
                            />
                        </View>
                    })
                }
            </ScrollView>
        </View>
    </View>
}

export default Performance

const styles: any = () => StyleSheet.create({
    col: {
        width: '100%',
        height: 80,
        marginBottom: 15,
        backgroundColor: 'white'
    },
});
