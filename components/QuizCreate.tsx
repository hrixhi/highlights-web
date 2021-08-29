import React, { useState, useCallback } from 'react';
import { StyleSheet, Image, Dimensions } from 'react-native';
import { TextInput } from "./CustomTextInput";
import { Text, TouchableOpacity, View } from '../components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import EquationEditor from 'equation-editor-react';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from "@react-native-picker/picker";

import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from "react-native-popup-menu";

const questionTypeOptions = [
    {
        label: "MCQ",
        value: "",
    },
    {
        label: "Free response",
        value: "freeResponse"
    },
    {
        label: "True/False",
        value: "trueFalse"
    }
]

const QuizCreate: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [problems, setProblems] = useState<any[]>(props.problems ? props.problems : [])
    const [headers, setHeaders] = useState<any>(props.headers ? props.headers : {});

    const galleryCallback = useCallback(async (index: any, i: any) => {
        const gallerySettings = await ImagePicker.getMediaLibraryPermissionsAsync()
        if (!gallerySettings.granted) {
            await ImagePicker.requestMediaLibraryPermissionsAsync()
            const updatedGallerySettings = await ImagePicker.getMediaLibraryPermissionsAsync()
            if (!updatedGallerySettings.granted) {
                return;
            }
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
            base64: true
        });

        if (!result.cancelled) {
            if (i !== null) {
                const newProbs = [...problems];
                newProbs[index].options[i].option = "image:" + result.uri;
                setProblems(newProbs)
                props.setProblems(newProbs)
            } else {
                const newProbs = [...problems];
                newProbs[index].question = "image:" + result.uri;
                setProblems(newProbs)
                props.setProblems(newProbs)
            }
        }
    }, [problems, props.setProblems])

    const removeHeadersOnDeleteProblem = (index: number) => {

        const headerPositions = Object.keys(headers);

        const headerIndicesToUpdate = headerPositions.filter((i: any) => i > index);

        const currentHeaders = JSON.parse(JSON.stringify(headers));

        delete currentHeaders[index];

        headerIndicesToUpdate.forEach((i: any) => {

            // Set i - 1

            const currHeaderValue = headers[i];

            delete currentHeaders[i];

            currentHeaders[i - 1] = currHeaderValue;

        })

        setHeaders(currentHeaders);
        props.setHeaders(currentHeaders)


    }


    const addHeader = (index: number) => {

        // Use headers as an object with key as index values
        const currentHeaders = JSON.parse(JSON.stringify(headers));
        currentHeaders[index] = "";
        setHeaders(currentHeaders);
        props.setHeaders(currentHeaders);

    }

    const removeHeader = (index: number) => {

        const currentHeaders = JSON.parse(JSON.stringify(headers));
        delete currentHeaders[index];
        setHeaders(currentHeaders)
        props.setHeaders(currentHeaders);

    }

    const renderHeaderOption = (index: number) => {
        return <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'flex-start' }} >
            {index in headers
                ?
                <View style={{ flexDirection: 'row', width: '95%', marginTop: 50, paddingLeft: 20 }}>
                    <View style={{ width: Dimensions.get('window').width < 768 ? '95%' : '50%' }}>
                        <TextInput
                            value={headers[index]}
                            placeholder={'Heading'}
                            onChangeText={val => {
                                const currentHeaders = JSON.parse(JSON.stringify(headers))
                                currentHeaders[index] = val
                                setHeaders(currentHeaders);
                                props.setHeaders(currentHeaders)
                            }}
                            placeholderTextColor={'#818385'}
                            hasMultipleLines={false}
                        />
                    </View>
                    <View style={{ paddingTop: 20, paddingLeft: 20 }}>
                        <Ionicons
                            name='close-outline'
                            onPress={() => {
                                removeHeader(index)
                            }}
                            size={17}
                        />
                    </View>
                </View>
                :
                <TouchableOpacity
                    style={{ width: 100, flexDirection: 'row', }}
                    onPress={() => addHeader(index)}
                >
                    {/* <Ionicons name='add-circle' size={19} color={"#2f2f3c"} /> */}
                    <Text
                        style={{
                            marginLeft: 10,
                            fontSize: 10,
                            paddingBottom: 20,
                            textTransform: "uppercase",
                            // paddingLeft: 20,
                            flex: 1,
                            lineHeight: 25,
                            color: '#2f2f3c',
                            paddingLeft: 12
                        }}>
                        Add Header
                    </Text>
                </TouchableOpacity>}
        </View>
    }

    return (
        <View style={{
            width: '100%', height: '100%', backgroundColor: 'white',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderTopColor: '#F8F9FA',
            borderTopWidth: 1,
            marginTop: 35,
            paddingTop: 25,
            flexDirection: 'column',
            justifyContent: 'flex-start'
        }}
        >
            {/* Insert HEADER FOR INDEX 0 */}
            {
                problems.map((problem: any, index: any) => {
                    const { questionType } = problem;
                    return <View style={{ borderBottomColor: '#F8F9FA', borderBottomWidth: index === (problems.length - 1) ? 0 : 1, marginBottom: 25 }}>
                        {renderHeaderOption(index)}
                        <View style={{ flexDirection: 'row' }}>
                            <View style={{ paddingTop: 15 }}>
                                <Text style={{ color: '#2f2f3c', fontSize: 15, paddingBottom: 25, marginRight: 10, paddingTop: 12 }}>
                                    {index + 1}.
                                </Text>
                            </View>
                            <View style={{ flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row', width: '95%' }}>
                                <View style={{ width: Dimensions.get('window').width < 768 ? '95%' : '50%' }}>
                                    {
                                        problem.question && problem.question.includes("image:") ?
                                            <Image
                                                resizeMode={'contain'}
                                                style={{
                                                    width: 400,
                                                    height: 400,
                                                    maxWidth: '100%'
                                                }}
                                                source={{
                                                    uri: problem.question.split("image:")[1]
                                                }}
                                            />
                                            :
                                            (problem.question && problem.question.includes("formula:") ?
                                                <View style={{
                                                    borderColor: '#F8F9FA',
                                                    borderWidth: 1,
                                                    borderRadius: 15,
                                                    padding: 10,
                                                    width: '100%'
                                                }}>
                                                    <EquationEditor
                                                        value={problem.question.split("formula:")[1]}
                                                        onChange={(eq) => {
                                                            const newProbs = [...problems];
                                                            newProbs[index].question = "formula:" + eq;
                                                            setProblems(newProbs)
                                                            props.setProblems(newProbs)
                                                        }}
                                                        autoCommands="pi theta sqrt sum prod alpha beta gamma rho int"
                                                        autoOperatorNames="sin cos tan arccos arcsin arctan"
                                                    />
                                                </View>
                                                :
                                                <TextInput
                                                    value={problem.question}
                                                    // style={styles.input}
                                                    placeholder={PreferredLanguageText('problem')}
                                                    onChangeText={val => {
                                                        const newProbs = [...problems];
                                                        newProbs[index].question = val;
                                                        setProblems(newProbs)
                                                        props.setProblems(newProbs)
                                                    }}
                                                    placeholderTextColor={'#818385'}
                                                    hasMultipleLines={true}
                                                />)
                                    }
                                    <View style={{ flexDirection: 'row' }}>
                                        {
                                            problem.question && problem.question.includes("image:") ? null :
                                                <TouchableOpacity
                                                    style={{
                                                        backgroundColor: '#fff'
                                                    }}
                                                    onPress={() => {
                                                        if (problem.question && problem.question.includes("formula:")) {
                                                            const newProbs = [...problems];
                                                            newProbs[index].question = "";
                                                            setProblems(newProbs)
                                                            props.setProblems(newProbs)
                                                        } else {
                                                            const newProbs = [...problems];
                                                            newProbs[index].question = "formula:";
                                                            setProblems(newProbs)
                                                            props.setProblems(newProbs)
                                                        }
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            paddingTop: problem.question && problem.question.includes("formula:")
                                                                ? 10 : 0,
                                                            color: '#818385',
                                                            fontFamily: 'Overpass',
                                                            fontSize: 10
                                                        }}
                                                    >
                                                        {
                                                            problem.question && problem.question.includes("formula:")
                                                                ? "SWITCH TO TEXT" : "SWITCH TO FORMULA"
                                                        }
                                                    </Text>
                                                </TouchableOpacity>
                                        }
                                        <TouchableOpacity
                                            style={{
                                                backgroundColor: '#fff', paddingLeft: 10
                                            }}
                                            onPress={() => {
                                                if (problem.question && problem.question.includes("image:")) {
                                                    const newProbs = [...problems];
                                                    newProbs[index].question = "";
                                                    setProblems(newProbs)
                                                    props.setProblems(newProbs)
                                                } else {
                                                    galleryCallback(index, null)
                                                }
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    paddingTop: problem.question && (problem.question.includes("image:") || problem.question.includes("formula:"))
                                                        ? 10 : 0,
                                                    color: '#818385',
                                                    fontFamily: 'Overpass',
                                                    fontSize: 10
                                                }}
                                            >
                                                {
                                                    problem.question && problem.question.includes("image:")
                                                        ? "REMOVE IMAGE" : "ADD IMAGE"
                                                }
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                {/* Add dropdown here */}
                                <View style={{ flex: 1, flexDirection: 'row' }}>
                                    <View style={{
                                        // display: 'flex',
                                        alignItems: 'center',
                                        flexDirection: 'row',
                                        paddingTop: 25,
                                        // paddingHorizontal: 20,
                                        paddingLeft: Dimensions.get('window').width < 768 ? 0 : 20,
                                        maxWidth: '25%'
                                    }}>
                                        <TextInput
                                            value={problem.points}
                                            // style={styles.input}
                                            placeholder={PreferredLanguageText('enterPoints')}
                                            onChangeText={val => {
                                                const newProbs = [...problems];
                                                newProbs[index].points = val;
                                                setProblems(newProbs)
                                                props.setProblems(newProbs)
                                            }}
                                            placeholderTextColor={'#818385'}
                                        />
                                    </View>
                                    <View
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            flexDirection: 'row'
                                        }}>
                                        <Menu
                                            onSelect={(questionType: any) => {
                                                const updatedProblems = [...problems]
                                                updatedProblems[index].questionType = questionType;
                                                // Clear Options 
                                                if (questionType === "freeResponse") {
                                                    updatedProblems[index].options = []
                                                } else if (questionType === "trueFalse") {
                                                    updatedProblems[index].options = []
                                                    updatedProblems[index].options.push({
                                                        option: 'True',
                                                        isCorrect: false
                                                    })
                                                    updatedProblems[index].options.push({
                                                        option: 'False',
                                                        isCorrect: false
                                                    })
                                                }
                                                setProblems(updatedProblems)
                                                props.setProblems(updatedProblems)
                                            }}
                                            style={{ paddingTop: 13, paddingRight: 20, paddingLeft: 20 }}
                                        >
                                            <MenuTrigger>
                                                <Text
                                                    style={{
                                                        fontFamily: "inter",
                                                        fontSize: 14,
                                                        color: "#2f2f3c",
                                                    }}
                                                >
                                                    {questionType === "" ? "MCQ" : questionType}
                                                    <Ionicons name="caret-down" size={14} />
                                                </Text>
                                            </MenuTrigger>
                                            <MenuOptions
                                                customStyles={{
                                                    optionsContainer: {
                                                        padding: 10,
                                                        borderRadius: 15,
                                                        shadowOpacity: 0,
                                                        borderWidth: 1,
                                                        borderColor: "#F8F9FA",
                                                        overflow: 'scroll',
                                                        maxHeight: '100%'
                                                    },
                                                }}
                                            >
                                                {questionTypeOptions.map((item: any) => {
                                                    return (
                                                        <MenuOption value={item.value}>
                                                            <Text>{item.value === "" ? "MCQ" : item.label}</Text>
                                                        </MenuOption>
                                                    );
                                                })}
                                            </MenuOptions>
                                        </Menu>
                                    </View>
                                    <View style={{ paddingTop: 15, flexDirection: 'row', alignItems: 'center', }}>
                                        <input
                                            style={{ paddingRight: 20 }}
                                            type='checkbox'
                                            checked={problem.required}
                                            onChange={(e) => {
                                                const updatedProblems = [...problems]
                                                updatedProblems[index].required = !updatedProblems[index].required;
                                                setProblems(updatedProblems)
                                                props.setProblems(updatedProblems)
                                            }}
                                        />
                                        <Text style={{ fontSize: 10, textTransform: 'uppercase', marginLeft: 10 }}>
                                            Required
                                        </Text>
                                    </View>
                                    <View style={{ paddingTop: 15, paddingLeft: 20, flexDirection: 'row', alignItems: 'center' }}>
                                        <Ionicons
                                            name='close-outline'
                                            onPress={() => {
                                                const updatedProblems = [...problems]
                                                updatedProblems.splice(index, 1);

                                                removeHeadersOnDeleteProblem(index + 1);

                                                setProblems(updatedProblems)
                                                props.setProblems(updatedProblems)
                                            }}
                                            size={17}
                                        />
                                    </View>
                                </View>
                            </View>
                        </View>
                        {/* Add is requied Checkbox */}
                        {
                            problem.options.map((option: any, i: any) => {
                                return <View style={{ flexDirection: 'row', marginTop: 10 }}>
                                    <View style={{ paddingTop: 25, paddingHorizontal: 20 }}>
                                        <input
                                            style={{ paddingRight: 20 }}
                                            type='checkbox'
                                            checked={option.isCorrect}
                                            onChange={(e) => {
                                                const updatedProblems = [...problems]
                                                if (questionType === "trueFalse") {
                                                    updatedProblems[index].options[0].isCorrect = false;
                                                    updatedProblems[index].options[1].isCorrect = false;
                                                }
                                                updatedProblems[index].options[i].isCorrect = !updatedProblems[index].options[i].isCorrect;
                                                setProblems(updatedProblems)
                                                props.setProblems(updatedProblems)
                                            }}
                                        />
                                    </View>
                                    <View style={{ width: '50%', paddingRight: 30 }}>
                                        {
                                            option.option && option.option.includes("image:") ?
                                                <Image
                                                    resizeMode={'contain'}
                                                    style={{
                                                        width: 200,
                                                        height: 200
                                                    }}
                                                    source={{
                                                        uri: option.option.split("image:")[1]
                                                    }}
                                                />
                                                :
                                                (option.option && option.option.includes("formula:") ?
                                                    <View style={{
                                                        borderColor: '#F8F9FA',
                                                        borderWidth: 1,
                                                        borderRadius: 15,
                                                        padding: 10,
                                                        width: '50%'
                                                    }}>
                                                        <EquationEditor
                                                            value={option.option.split("formula:")[1]}
                                                            onChange={(eq) => {
                                                                const newProbs = [...problems];
                                                                newProbs[index].options[i].option = "formula:" + eq;
                                                                setProblems(newProbs)
                                                                props.setProblems(newProbs)
                                                            }}
                                                            autoCommands="pi theta sqrt sum prod alpha beta gamma rho int"
                                                            autoOperatorNames="sin cos tan arccos arcsin arctan"
                                                        />
                                                    </View> :
                                                    <View style={{ width: '95%' }}>
                                                        <TextInput
                                                            value={option.option}
                                                            placeholder={PreferredLanguageText('option')}
                                                            onChangeText={val => {
                                                                const newProbs = [...problems];
                                                                newProbs[index].options[i].option = val;
                                                                setProblems(newProbs)
                                                                props.setProblems(newProbs)
                                                            }}
                                                            editable={questionType === "trueFalse" ? false : true}
                                                            placeholderTextColor={'#818385'}
                                                        />

                                                    </View>)
                                        }
                                        <View style={{ flexDirection: 'row' }}>
                                            {
                                                (option.option && option.option.includes("image:")) || questionType === "trueFalse" ? null :
                                                    <TouchableOpacity
                                                        style={{ backgroundColor: '#fff' }}
                                                        onPress={() => {
                                                            if (option.option && option.option.includes("formula:")) {
                                                                const newProbs = [...problems];
                                                                newProbs[index].options[i].option = "";
                                                                setProblems(newProbs)
                                                                props.setProblems(newProbs)
                                                            } else {
                                                                const newProbs = [...problems];
                                                                newProbs[index].options[i].option = "formula:";
                                                                setProblems(newProbs)
                                                                props.setProblems(newProbs)
                                                            }
                                                        }}
                                                    >
                                                        <Text
                                                            style={{
                                                                paddingTop: option.option && option.option.includes("formula:")
                                                                    ? 10 : 0,
                                                                color: '#818385',
                                                                fontFamily: 'Overpass',
                                                                fontSize: 10
                                                            }}
                                                        >
                                                            {
                                                                option.option && option.option.includes("formula:")
                                                                    ? "SWITCH TO TEXT" : "SWITCH TO FORMULA"
                                                            }
                                                        </Text>
                                                    </TouchableOpacity>
                                            }
                                            {questionType === "trueFalse" ? null : <TouchableOpacity
                                                style={{
                                                    backgroundColor: '#fff', paddingLeft: 10
                                                }}
                                                onPress={() => {
                                                    if (option.option && option.option.includes("image:")) {
                                                        const newProbs = [...problems];
                                                        newProbs[index].options[i].option = "";
                                                        setProblems(newProbs)
                                                        props.setProblems(newProbs)
                                                    } else {
                                                        galleryCallback(index, i)
                                                    }
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        paddingTop: option.option && option.option.includes("formula:")
                                                            ? 10 : 0,
                                                        color: '#818385',
                                                        fontFamily: 'Overpass',
                                                        fontSize: 10
                                                    }}
                                                >
                                                    {
                                                        option.option && option.option.includes("image:")
                                                            ? "REMOVE IMAGE" : "ADD IMAGE"
                                                    }
                                                </Text>
                                            </TouchableOpacity>}
                                            {questionType === "trueFalse" ? null :
                                                <TouchableOpacity
                                                    style={{
                                                        backgroundColor: '#fff', paddingLeft: 10
                                                    }}
                                                    onPress={() => {
                                                        const updatedProblems = [...problems]
                                                        updatedProblems[index].options.splice(i, 1);
                                                        setProblems(updatedProblems)
                                                        props.setProblems(updatedProblems)
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            paddingTop: option.option && option.option.includes("formula:")
                                                                ? 10 : 0,
                                                            color: '#818385',
                                                            fontFamily: 'Overpass',
                                                            fontSize: 10
                                                        }}
                                                    >
                                                        CLEAR
                                                    </Text>
                                                </TouchableOpacity>
                                            }
                                        </View>
                                    </View>
                                </View>
                            })
                        }

                        {/* Only show Add Choice if questionType is MCQ ("") */}

                        {questionType === "" ? <TouchableOpacity
                            onPress={() => {
                                const updatedProblems = [...problems]
                                updatedProblems[index].options.push({
                                    option: '',
                                    isCorrect: false
                                })
                                setProblems(updatedProblems)
                                props.setProblems(updatedProblems)
                            }}
                            style={{ width: 100, flexDirection: 'row', marginLeft: 20, marginTop: 20 }} >
                            {/* <Ionicons name='add-circle' size={19} color={"#2f2f3c"} /> */}
                            <Text
                                style={{
                                    // marginLeft: 10,
                                    fontSize: 10,
                                    paddingBottom: 20,
                                    textTransform: "uppercase",
                                    // paddingLeft: 20,
                                    flex: 1,
                                    lineHeight: 25,
                                    color: '#3b64f8'
                                }}>
                                Add Option
                            </Text>
                        </TouchableOpacity> : <View style={{ height: 100 }} />}
                    </View>
                })
            }
            <View style={{
                width: '100%', flexDirection: 'row',
                justifyContent: 'flex-start', paddingLeft: 12,
                paddingTop: 25, borderBottomColor: '#dddddd',
                paddingBottom: 25, borderBottomWidth: 1
            }}>
                <TouchableOpacity
                    onPress={() => {
                        const updatedProblems = [...problems, { question: '', options: [], points: '', questionType: '', required: true }]
                        setProblems(updatedProblems)
                        props.setProblems(updatedProblems)
                    }}
                    style={{
                        borderRadius: 15,
                        backgroundColor: "white",
                    }}
                >
                    <Text
                        style={{
                            textAlign: "center",
                            lineHeight: 35,
                            color: "white",
                            fontSize: 12,
                            backgroundColor: "#3B64F8",
                            borderRadius: 15,
                            paddingHorizontal: 25,
                            fontFamily: "inter",
                            overflow: "hidden",
                            height: 35,
                            textTransform: "uppercase",
                        }}>
                        Add Problem
                    </Text>
                </TouchableOpacity>
            </View>
        </View >
    );
}

export default QuizCreate;

const styles = StyleSheet.create({
    input: {
        width: '50%',
        borderBottomColor: '#F8F9FA',
        borderBottomWidth: 1,
        fontSize: 15,
        paddingTop: 12,
        paddingBottom: 12,
        marginTop: 5,
        marginBottom: 20
    },
    picker: {
        display: "flex",
        justifyContent: "flex-start",
        backgroundColor: "white",
        overflow: "hidden",
        fontSize: 12,
        borderWidth: 1,
        width: 100,
        height: 20,
        marginTop: 10,
        borderRadius: 3
    }
});
