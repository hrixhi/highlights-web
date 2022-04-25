import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Animated, Dimensions, Switch, ScrollView } from 'react-native';
import { Text, TouchableOpacity, View } from './Themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MessengerCustomerChat from 'react-messenger-customer-chat';
import { fetchAPI } from '../graphql/FetchAPI';
import { getRole } from '../graphql/QueriesAndMutations';
import Collapse from 'react-collapse';
import { Ionicons } from '@expo/vector-icons';
import Profile from './Profile';

const Walkthrough: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [modalAnimation] = useState(new Animated.Value(0));
    const [isInstructor, setIsInstructor] = useState(false);
    const [showSavePassword, setShowSavePassword] = useState(false);
    const [options, setOptions] = useState<any[]>([
        // instructors
        {
            question: 'Home',
            steps: [
                'Cues (content) are organised by channel & category.',
                'Cues are sorted by priority, with red indicating a higher priority than green.',
                'Cues can also be filtered by date.',
            ],
            instructorOnly: true,
            isOpen: false,
        },
        {
            question: 'Set up a channel',
            steps: [
                "Click on the 'Channels' option on your home screen.",
                "Click on the 'Create' option within channels.",
                'Enter a name and password (optional).',
                'Color code your channel.',
                'Temporary channels can be deleted by instructors. All other channels can only be deleted by the school administrator.',
            ],
            instructorOnly: true,
            isOpen: false,
        },
        {
            question: 'Channel options',
            steps: [
                'Select a channel on your home screen to display channel options.',
                'Classroom: For lectures, lecture recordings & attendances.',
                'Inbox: Chat with or meet with students/groups.',
                'Discussion: General Q&A.',
                'Grades: Grades and class performance.',
                'Settings: Channel settings.',
            ],
            instructorOnly: true,
            isOpen: false,
        },
        {
            question: 'Add students to a channel',
            steps: [
                "Students can subscribe to your channel using it's name and password.",
                'To add subscribers directly instead, select the channel on your home screen.',
                "Pick 'Settings' from channel options.",
                'Use the dropdown to add/remove subscribers.',
                'You can also add/remove moderators or edit channel details.',
            ],
            instructorOnly: true,
            isOpen: false,
        },
        {
            question: 'Share content with channel',
            steps: [
                "Click '+' on your home screen to create a new cue.",
                'Create or import a file.',
                'In the cue options, select channel to share cue with, category, priority, etc.',
                'Share cue with channel. Subscribers will be notified.',
            ],
            instructorOnly: true,
            isOpen: false,
        },
        {
            question: 'Cue options',
            steps: [
                'Click on a cue on your home screen to view it.',
                'Content: Shared material.',
                'Details: Editable information.',
                'Q&A: Discussion regarding content.',
                'Notes: Add personal notes to content.',
                'Responses: View engagement.',
            ],
            instructorOnly: true,
            isOpen: false,
        },
        {
            question: 'Testing',
            steps: [
                'Tests can be created as cues that require submissions or as quizzes.',
                "Follow aforementioned instructions to create a cue and turn on the 'submission' switch.",
            ],
            instructorOnly: true,
            isOpen: false,
        },
        {
            question: 'Grading',
            steps: [
                "Responses to tests can be viewed by first clicking on the cue and then selecting the 'Responses' options.",
                "Use the filter to and select 'submitted'.",
                "Click on a subscriber's name to view the response.",
                'Enter a score. To add remarks, click and drag on the submission to pick region and enter annotation.',
                'Use the release grade option to make scrores visibile to students.',
                "The 'Grades' channel option provides a comprehensive list of all scores and performance metrics.",
                'Instructors can use this option to also directly add/modify scores.',
            ],
            instructorOnly: true,
            isOpen: false,
        },
        {
            question: 'Classroom meetings',
            steps: [
                'Select a channel on your home screen to display channel options.',
                "Select the 'Classroom' channel option.",
                'Meetings can only be joined if the instructor is present.',
                'Subscribers can also view lecture recordings or attendances.',
                'Use the planner to schedule lecture meetings.',
                'Attendances will only be captured for scheduled meetings.',
            ],
            instructorOnly: true,
            isOpen: false,
        },
        {
            question: 'Notes & reminders',
            steps: [
                'Users can take personal notes directly on content or create their personal cues.',
                "Personal notes are stored in the 'My Cues' channel and are not shared.",
                'For content-wise notes, first select the cue which you want to take notes on.',
                "Select the 'Notes' channel option.",
                'Add your personal notes.',
                'To add a reminder to a cue, first click on the cue.',
                "Select the 'Details' cue option.",
                'Use the reminder switch to enable alerts.',
            ],
            instructorOnly: true,
            isOpen: false,
        },
        {
            question: 'Planner',
            steps: [
                'The planner displays submissions, lectures & other channel/personal events.',
                "Click on the 'Planner' option within channels.",
                'Use the filter to view specific events.',
                "To create a new event/lecture click on 'Add'",
                'Pick a channel to share with and select event type.',
                'Create event.',
            ],
            instructorOnly: true,
            isOpen: false,
        },
        // students only
        {
            question: 'Home',
            steps: [
                'Cues (content) are organised by channel & category.',
                'Cues are sorted by priority, with red indicating a higher priority than green.',
                'Cues can also be filtered by date.',
            ],
            instructorOnly: false,
            isOpen: false,
        },
        {
            question: 'Join a channel',
            steps: [
                "Click on the 'Channels' option on your home screen.",
                "Click on the 'Subscribe' option within channels.",
                'Enter given channel name and password (optional).',
                'Subscribe to channel.',
            ],
            instructorOnly: false,
            isOpen: false,
        },
        {
            question: 'Channel options',
            steps: [
                'Select a channel on your home screen to display channel options.',
                'Classroom: For lectures, lecture recordings & attendances.',
                'Inbox: Chat with or meet with students/groups.',
                'Discussion: General Q&A.',
                'Grades: Grades and class performance.',
                'Settings: Channel settings.',
            ],
            instructorOnly: false,
            isOpen: false,
        },
        {
            question: 'Cue options',
            steps: [
                'Click on a cue on your home screen to view it.',
                'Content: Shared material.',
                'Details: Editable information.',
                'Q&A: Discussion regarding content.',
                'Notes: Add personal notes to content.',
                'Responses: View engagement.',
            ],
            instructorOnly: false,
            isOpen: false,
        },
        {
            question: 'Testing',
            steps: [
                'Students will have to provide submissions to Cues as required.',
                "Select the 'Submission' channel option (if visible) to enter submission.",
                'For quizzes, users must directly provide answers.',
                'Submissions can be created directly or imported.',
                'Click on submit.',
                'You will be notified as and when grades are released.',
            ],
            instructorOnly: false,
            isOpen: false,
        },
        {
            question: 'Grading',
            steps: [
                'Click on a graded cue on your home screen to view it.',
                'Scores and remarks will be visible over the given submission.',
                "The 'Grades' channel option provides a comprehensive list of all scores and performance metrics pertaining to the channel.",
            ],
            instructorOnly: false,
            isOpen: false,
        },
        {
            question: 'Classroom meetings',
            steps: [
                'Select a channel on your home screen to display channel options.',
                "Select the 'Classroom' channel option.",
                'Meetings can only be joined if the instructor is present.',
                'Subscribers can also view lecture recordings or attendances.',
                'Use the planner to schedule lecture meetings.',
                'Attendances will only be captured for scheduled meetings.',
            ],
            instructorOnly: false,
            isOpen: false,
        },
        {
            question: 'Notes & reminders',
            steps: [
                'Users can take personal notes directly on content or create their personal cues.',
                "Personal notes are stored in the 'My Cues' channel and are not shared.",
                'For content-wise notes, first select the cue which you want to take notes on.',
                "Select the 'Notes' channel option.",
                'Add your personal notes.',
                'To add a reminder to a cue, first click on the cue.',
                "Select the 'Details' cue option.",
                'Use the reminder switch to enable alerts.',
            ],
            instructorOnly: false,
            isOpen: false,
        },
        {
            question: 'Planner',
            steps: [
                'The planner displays submissions, lectures & other channel/personal events.',
                "Click on the 'Planner' option within channels.",
                'Use the filter to view specific events.',
                "To create a new event/lecture click on 'Add'",
                'Pick a channel to share with and select event type.',
                'Create event.',
            ],
            instructorOnly: false,
            isOpen: false,
        },
    ]);

    const loadIsInstructor = useCallback(async () => {
        const u = await AsyncStorage.getItem('user');
        if (u) {
            const user = JSON.parse(u);
            const server = fetchAPI('');
            server
                .query({
                    query: getRole,
                    variables: {
                        userId: user._id,
                    },
                })
                .then((res) => {
                    if (res.data && res.data.user.getRole) {
                        if (res.data.user.getRole === 'instructor') {
                            setIsInstructor(true);
                        }
                    }
                });
        }
    }, []);

    useEffect(() => {
        loadIsInstructor();
        Animated.timing(modalAnimation, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <View
            style={{
                width: '100%',
                height: '100%',
                maxHeight:
                    Dimensions.get('window').width < 1024
                        ? Dimensions.get('window').height - 115
                        : Dimensions.get('window').height - 52,
                backgroundColor: '#fff',
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                overflow: 'hidden',
            }}
        >
            <View
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'white',
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                }}
            >
                {showSavePassword ? (
                    <View
                        style={{
                            flexDirection: 'row',
                            width: '100%',
                            alignSelf: 'center',
                            maxWidth: 400,
                            height: 50,
                            marginBottom: 10,
                            marginTop: 20,
                        }}
                    >
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity
                                onPress={() => {
                                    props.setShowHelp(false);
                                    setShowSavePassword(false);
                                }}
                                style={{
                                    paddingRight: 20,
                                    paddingTop: 5,
                                    paddingBottom: 20,
                                    paddingLeft: Dimensions.get('window').width < 768 ? 20 : 0,
                                    alignSelf: 'flex-start',
                                }}
                            >
                                <Text style={{ lineHeight: 34, width: '100%', textAlign: 'center' }}>
                                    <Ionicons name="arrow-back-outline" size={30} color={'#1F1F1F'} />
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : null}
                <View
                    style={{
                        width: '100%',
                        flexDirection: 'row',
                    }}
                >
                    <View
                        style={{
                            width: '100%',
                            borderColor: '#f2f2f2',
                        }}
                    >
                        <Profile
                            closeModal={() => props.closeModal()}
                            saveDataInCloud={() => props.saveDataInCloud()}
                            reOpenProfile={() => props.reOpenProfile()}
                            reloadData={() => props.reloadData()}
                            setShowSavePassword={(val: any) => setShowSavePassword(val)}
                            showSavePassword={showSavePassword}
                            user={props.user}
                        />
                    </View>
                </View>
            </View>
            {/* <MessengerCustomerChat pageId="109965671259610" appId="746023139417168" themeColor="#006AFF" /> */}
        </View>
    );
};

export default Walkthrough;

const styles = StyleSheet.create({
    screen: {
        backgroundColor: 'white',
        height: '100%',
        width: '100%',
        maxWidth: 1024,
        paddingHorizontal: Dimensions.get('window').width < 1024 ? 0 : 50,
        // alignSelf: 'center',
        borderTopRightRadius: 0,
        borderTopLeftRadius: 0,
        zIndex: -1,
    },
});
