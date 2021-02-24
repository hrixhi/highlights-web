import React, { useCallback, useState } from 'react';
import { StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import Swiper from 'react-native-swiper'
import { View, Text, TouchableOpacity } from './Themed';
import _ from 'lodash'
import { Ionicons } from '@expo/vector-icons';
import SubscriberCard from './SubscriberCard';

const SubscribersList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [loading, setLoading] = useState(false)
    const [filterChoice, setFilterChoice] = useState('All')
    const unparsedSubs: any[] = JSON.parse(JSON.stringify(props.subscribers))
    const [subscribers] = useState<any[]>(unparsedSubs.reverse())
    const [numCards] = useState(7)
    const categories = ['All', 'Read', 'Delivered', 'Not Delivered']
    const styles = styleObject()
    let filteredSubscribers: any = []
    switch (filterChoice) {
        case 'All':
            filteredSubscribers = subscribers
            break;
        case 'Read':
            filteredSubscribers = subscribers.filter(item => {
                return item.fullName === 'read'
            })
            break;
        case 'Delivered':
            filteredSubscribers = subscribers.filter(item => {
                return item.fullName === 'delivered'
            })
            break;
        case 'Not Delivered':
            filteredSubscribers = subscribers.filter(item => {
                return item.fullName === 'not-delivered'
            })
            break;
        default:
            filteredSubscribers = subscribers
            break;
    }
    const pages = new Array(Math.ceil(filteredSubscribers.length / numCards))
    const length = filteredSubscribers.length
    for (let i = 0; i < pages.length; i++) {
        pages[i] = 0
    }

    const loadSubscriberInfo = useCallback((userId) => {

    }, [])

    return (
        <View style={{
            backgroundColor: 'white',
            width: '100%',
            height: '100%',
            paddingHorizontal: 20,
            borderTopRightRadius: 30,
            borderTopLeftRadius: 30
        }}>
            <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 25 }}>
                {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
            </Text>
            <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: 15 }}>
                {
                    props.cueId ?
                        <Text
                            ellipsizeMode="tail"
                            style={{ color: '#a6a2a2', fontSize: 18, flex: 1, lineHeight: 25 }}>
                            Status
                        </Text> :
                        <Text
                            ellipsizeMode="tail"
                            style={{ color: '#a6a2a2', fontSize: 18, flex: 1, lineHeight: 25 }}>
                            Subscribers
                        </Text>
                }
            </View>
            {
                subscribers.length === 0 ?
                    <View style={{ backgroundColor: 'white' }}>
                        <Text style={{ width: '100%', color: '#a6a2a2', fontWeight: 'bold', fontSize: 25, paddingTop: 100, paddingHorizontal: 5, fontFamily: 'inter' }}>
                            {
                                props.cueId ? 'No statuses.' : 'No subscribers.'
                            }
                        </Text>
                    </View>
                    : (
                        loading ?
                            <View style={{
                                width: '100%',
                                justifyContent: 'center',
                                flex: 1,
                                flexDirection: 'column',
                                backgroundColor: 'white'
                            }}>
                                <ActivityIndicator color={'#a6a2a2'} />
                            </View> :
                            <View style={{
                                width: '100%',
                                backgroundColor: 'white',
                                flex: 1
                            }}
                                key={JSON.stringify(filteredSubscribers)}
                            >
                                <Swiper
                                    key={JSON.stringify(filteredSubscribers)}
                                    containerStyle={{}}
                                    index={0}
                                    activeDotColor={'#0079FE'}
                                    horizontal={false}
                                    dotColor={'#e0e0e0'}
                                    dotStyle={{ marginRight: -30, marginBottom: 11, opacity: 1 }}
                                    activeDotStyle={{ marginRight: -30, marginBottom: 11, opacity: 1 }}
                                    loop={false}
                                >
                                    {
                                        pages.map((pageUndef, pageNumber) => {
                                            const index = (pageNumber * numCards);
                                            return <View style={styles.screen} key={Math.random().toString() + JSON.stringify(filteredSubscribers)}>
                                                <View style={styles.col}>
                                                    <View style={styles.marginSmall} />
                                                    {
                                                        (index + 0 > length - 1) ? null :
                                                            <SubscriberCard
                                                                fadeAnimation={props.fadeAnimation}
                                                                subscriber={filteredSubscribers[index + 0]}
                                                                onPress={() => loadSubscriberInfo(filteredSubscribers[index + 0]._id)}
                                                                status={!props.cueId ? false : true}
                                                            />
                                                    }
                                                    <View style={styles.margin} />
                                                    {
                                                        (index + 1 > length - 1) ? null :
                                                            <SubscriberCard
                                                                fadeAnimation={props.fadeAnimation}
                                                                subscriber={filteredSubscribers[index + 1]}
                                                                onPress={() => loadSubscriberInfo(filteredSubscribers[index + 1]._id)}
                                                                status={!props.cueId ? false : true}
                                                            />
                                                    }
                                                    <View style={styles.margin} />
                                                    {
                                                        (index + 2 > length - 1) ? null :
                                                            <SubscriberCard
                                                                fadeAnimation={props.fadeAnimation}
                                                                subscriber={filteredSubscribers[index + 2]}
                                                                onPress={() => loadSubscriberInfo(filteredSubscribers[index + 2]._id)}
                                                                status={!props.cueId ? false : true}
                                                            />
                                                    }
                                                    <View style={styles.margin} />
                                                    {
                                                        (index + 3 > length - 1) ? null :
                                                            <SubscriberCard
                                                                fadeAnimation={props.fadeAnimation}
                                                                subscriber={filteredSubscribers[index + 3]}
                                                                onPress={() => loadSubscriberInfo(filteredSubscribers[index + 3]._id)}
                                                                status={!props.cueId ? false : true}
                                                            />
                                                    }
                                                    <View style={styles.margin} />
                                                    {
                                                        (index + 4 > length - 1) ? null :
                                                            <SubscriberCard
                                                                fadeAnimation={props.fadeAnimation}
                                                                subscriber={filteredSubscribers[index + 4]}
                                                                onPress={() => loadSubscriberInfo(filteredSubscribers[index + 4]._id)}
                                                                status={!props.cueId ? false : true}
                                                            />
                                                    }
                                                    <View style={styles.margin} />
                                                    {
                                                        (index + 5 > length - 1) ? null :
                                                            <SubscriberCard
                                                                fadeAnimation={props.fadeAnimation}
                                                                subscriber={filteredSubscribers[index + 5]}
                                                                onPress={() => loadSubscriberInfo(filteredSubscribers[index + 5]._id)}
                                                                status={!props.cueId ? false : true}
                                                            />
                                                    }
                                                    <View style={styles.margin} />
                                                    {
                                                        (index + 6 > length - 1) ? null :
                                                            <SubscriberCard
                                                                fadeAnimation={props.fadeAnimation}
                                                                subscriber={filteredSubscribers[index + 6]}
                                                                onPress={() => loadSubscriberInfo(filteredSubscribers[index + 6]._id)}
                                                                status={!props.cueId ? false : true}
                                                            />
                                                    }
                                                    <View style={styles.marginSmall} />
                                                </View>
                                            </View>
                                        })
                                    }
                                </Swiper>
                                {
                                    !props.cueId ? null :
                                        <View style={{
                                            width: '100%',
                                            height: 70,
                                            backgroundColor: 'white',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            flexDirection: 'column'
                                        }}>
                                            <ScrollView
                                                contentContainerStyle={{
                                                    height: 20, width: '100%'
                                                }}
                                                style={{}}
                                                horizontal={true}
                                                showsHorizontalScrollIndicator={false}
                                            >
                                                {
                                                    unparsedSubs.length === 0 ? null : categories.map((category: string) => {
                                                        return <TouchableOpacity
                                                            key={Math.random()}
                                                            style={filterChoice === category ? styles.cusCategoryOutline : styles.cusCategory}
                                                            onPress={() => setFilterChoice(category)}>
                                                            <Text
                                                                style={{
                                                                    color: '#a6a2a2',
                                                                    lineHeight: 20
                                                                }}>
                                                                {category}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    })
                                                }
                                            </ScrollView>
                                        </View>
                                }
                            </View>
                    )
            }
        </View >
    );
}

export default React.memo(SubscribersList, (prev, next) => {
    return _.isEqual(prev.threads, next.threads)
})


const styleObject = () => {
    return StyleSheet.create({
        screen: {
            flex: 1
        },
        margin: {
            height: '2.5%',
            backgroundColor: 'white'
        },
        marginSmall: {
            height: '1%',
            backgroundColor: 'white'
        },
        row: {
            flexDirection: 'row',
            display: 'flex',
            width: '100%',
            backgroundColor: 'white'
        },
        col: {
            width: '100%',
            paddingRight: 7.5,
            flex: 1,
            backgroundColor: 'white'
        },
        channelText: {
            textAlign: 'center',
            overflow: 'hidden'
        },
        outline: {
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#a6a2a2',
            color: 'white'
        },
        cusCategory: {
            fontSize: 15,
            backgroundColor: 'white',
            paddingHorizontal: 10,
            height: 22
        },
        cusCategoryOutline: {
            fontSize: 15,
            backgroundColor: 'white',
            paddingHorizontal: 10,
            height: 22,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#a6a2a2',
            color: 'white'
        }
    })
}
