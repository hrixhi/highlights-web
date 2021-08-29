import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, TextInput, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { TextInput as CustomTextInput } from './CustomTextInput'
import { Text, View } from './Themed';
import EquationEditor from 'equation-editor-react';


const Quiz: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [problems] = useState<any[]>(props.problems)
    const [solutions, setSolutions] = useState<any[]>(props.solutions.solutions)
    const [problemScores, setProblemScores] = useState<any[]>(props.solutions.problemScores)
    const [problemComments, setProblemComments] = useState<any[]>(props.solutions.problemComments ? props.solutions.problemComments : [])
    const [totalPossible, setTotalPossible] = useState(0);
    const [currentScore, setCurrentScore] = useState(0);
    const [percentage, setPercentage] = useState("");
    const [comment, setComment] = useState(props.comment ? props.comment : "");
    const [headers, setHeaders] = useState<any>(props.headers)

    useEffect(() => {

        setHeaders(props.headers);
        // setInstructions(props.instructions);

    }, [props.headers])


    useEffect(() => {
        let currentScore = 0;
        props.solutions.problemScores.forEach((score: any) => {
            currentScore += Number(score)
        })
        setCurrentScore(currentScore);

        if (props.solutions.solutions && !props.solutions.problemComments) {
            let comments: any[] = [];

            props.solutions.solutions.forEach((sol: any) => comments.push(""));

            setProblemComments(comments);

        }

    }, [props.solutions])

    useEffect(() => {
        let total = 0;
        props.problems.forEach((problem: any) => {
            total += problem.points;
        })
        setTotalPossible(total);
    }, [props.problems])

    useEffect(() => {
        let currentScore = 0;
        problemScores.forEach((score: any) => {
            currentScore += Number(score)
        })

        setCurrentScore(currentScore);

        if (totalPossible === 0) return;

        setPercentage(((currentScore / totalPossible) * 100).toFixed(2))

    }, [problemScores, totalPossible])

    const renderHeader = (index: number) => {
        if (index in headers) {
            return (<Text style={{ width: '100%', marginBottom: 30, marginTop: 70, fontSize: 15, fontWeight: "600" }}>
                {headers[index]}
            </Text>)
        }
        return null;
    }

    if (props.loading) return (<View
        style={{
            width: "100%",
            flex: 1,
            justifyContent: "center",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "white"
        }}>
        <ActivityIndicator color={"#818385"} />
    </View>)

    return (
        <View style={{
            width: '100%',
            backgroundColor: 'white',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            paddingTop: 15,
            paddingLeft: 0,
            flexDirection: 'column',
            justifyContent: 'flex-start'
        }}>
            <View style={{ width: '100%', flexDirection: 'row' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 10 }}>
                    <Text
                        style={{
                            fontSize: 12,
                            color: "white",
                            height: 22,
                            paddingHorizontal: 10,
                            borderRadius: 10,
                            backgroundColor: "#3B64F8",
                            lineHeight: 20,
                            paddingTop: 1
                        }}>
                        {percentage}%
                    </Text>
                    <Text
                        style={{
                            fontSize: 12,
                            color: "white",
                            height: 22,
                            // textAlign: 'right',
                            paddingHorizontal: 10,
                            marginLeft: 10,
                            borderRadius: 10,
                            backgroundColor: "#3B64F8",
                            lineHeight: 20,
                            paddingTop: 1
                        }}>
                        {currentScore}/{totalPossible}
                    </Text>
                    <Text style={{ fontSize: 11, color: "#2f2f3c", marginBottom: 10, paddingLeft: 20, lineHeight: 22, textTransform: 'uppercase' }}>
                        {props.partiallyGraded ? "In progress" : "Graded"}
                    </Text>
                </View>

            </View>

            {
                props.problems.map((problem: any, index: any) => {


                    let onlyOneCorrect = true;

                    if (!problem.questionType) {
                        let noOfCorrect = 0;

                        problem.options.map((option: any) => {
                            if (option.isCorrect) noOfCorrect++;
                        })

                        if (noOfCorrect > 1) onlyOneCorrect = false;
                    }

                    return <View style={{ borderBottomColor: '#F8F9FA', borderBottomWidth: index === (props.problems.length - 1) ? 0 : 1, marginBottom: 25 }} key={index}>
                        {renderHeader(index)}
                        <View style={{ flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row', flex: 1 }}>
                            <View style={{ flexDirection: 'row', flex: 1 }}>
                                <View style={{ paddingTop: 15 }}>
                                    <Text style={{ color: '#818385', fontSize: 15, paddingBottom: 25, marginRight: 10, paddingTop: 10 }}>
                                        {index + 1}.
                                    </Text>
                                </View>
                                {
                                    problem.question && problem.question.includes("image:") ?
                                        (<Image
                                            resizeMode={'contain'}
                                            style={{
                                                width: 400,
                                                height: 400
                                            }}
                                            source={{
                                                uri: problem.question.split("image:")[1]
                                            }}
                                        />) :
                                        (
                                            problem.question && problem.question.includes("formula:") ? (
                                                <View style={{
                                                    borderColor: '#F8F9FA',
                                                    borderWidth: 1,
                                                    borderRadius: 15,
                                                    padding: 10,
                                                    width: '50%'
                                                }}>
                                                    <EquationEditor
                                                        value={problem.question.split("formula:")[1]}
                                                        onChange={() => { return; }}
                                                        autoCommands="pi theta sqrt sum prod alpha beta gamma rho int"
                                                        autoOperatorNames="sin cos tan arccos arcsin arctan"
                                                    />
                                                </View>
                                            ) :
                                                <TextInput
                                                    editable={false}
                                                    value={problem.question}
                                                    style={{
                                                        // width: '25%',
                                                        flex: 1,
                                                        fontSize: 15,
                                                        padding: 15,
                                                        paddingTop: 12,
                                                        paddingBottom: 12,
                                                        marginTop: 5,
                                                        paddingRight: 30,
                                                        marginBottom: 20
                                                    }}
                                                    placeholder={'Problem ' + (index + 1).toString()}
                                                    placeholderTextColor={'#818385'}
                                                />
                                        )
                                }
                                {!props.isOwner ? null : <TextInput
                                    editable={props.isOwner ? true : false}
                                    value={problemScores[index]}
                                    onChange={(e: any) => {
                                        if (Number.isNaN(Number(e.target.value))) return
                                        const updateProblemScores = [...problemScores]
                                        updateProblemScores[index] = e.target.value;
                                        setProblemScores(updateProblemScores)
                                    }}
                                    style={{
                                        width: '23%',
                                        borderBottomColor: '#F8F9FA',
                                        borderBottomWidth: 1,
                                        fontSize: 15,
                                        padding: 15,
                                        paddingTop: 12,
                                        paddingBottom: 12,
                                        marginTop: 5,
                                        marginBottom: 20
                                    }}
                                    placeholder={'Enter points'}
                                    placeholderTextColor={'#818385'}
                                />}
                                {!props.isOwner ? null : <TextInput
                                    editable={false}
                                    value={"/ " + problem.points}
                                    style={{
                                        width: '23%',
                                        fontSize: 15,
                                        padding: 15,
                                        paddingTop: 12,
                                        paddingBottom: 12,
                                        marginTop: 5,
                                        paddingRight: 30,
                                        marginBottom: 20
                                    }}
                                    placeholder={'Enter points'}
                                    placeholderTextColor={'#818385'}
                                />}
                                {
                                    !props.isOwner ? <Text style={{ fontSize: 15, marginTop: 5, marginBottom: 20, paddingTop: 12, paddingRight: 30, textAlign: 'right' }}>
                                        {Number(problemScores[index]).toFixed(1)} / {Number(problem.points).toFixed(1)}
                                    </Text> : null
                                }
                            </View>
                            <View style={{ flexDirection: 'row' }}>
                                {
                                    !problem.questionType && !onlyOneCorrect ?
                                        (<Text style={{
                                            fontSize: 11, color: '#818385', marginBottom: 20, textAlign: 'left',
                                            paddingTop: Dimensions.get('window').width < 768 ? 25 : 15,
                                            paddingLeft: 35
                                        }}>
                                            more than one correct answer
                                        </Text>)
                                        : null
                                }
                                {
                                    !problem.required ?
                                        (<Text style={{
                                            fontSize: 11, color: '#818385', marginBottom: 20, textAlign: 'left', paddingLeft: 35,
                                            paddingTop: Dimensions.get('window').width < 768 ? 25 : 15
                                        }}>
                                            optional
                                        </Text>)
                                        : (<Text style={{
                                            fontSize: 11, color: '#818385', marginBottom: 20, textAlign: 'left', paddingLeft: 35,
                                            paddingTop: Dimensions.get('window').width < 768 ? 25 : 15
                                        }}>
                                            required
                                        </Text>)
                                }
                            </View>
                        </View>

                        {
                            (!problem.questionType || problem.questionType === "trueFalse") && problem.options.map((option: any, i: any) => {

                                let color = '#2f2f3c'
                                if (option.isCorrect) {
                                    color = '#3B64F8'
                                } else if (!option.isCorrect && solutions[index].selected[i].isSelected) {
                                    color = '#D91D56'
                                }


                                return <View style={{ flexDirection: 'row' }} key={solutions.toString() + i.toString()}>
                                    <View style={{ paddingLeft: 40, paddingRight: 10, paddingTop: 23 }}>
                                        <input
                                            disabled={true}
                                            style={{ paddingRight: 20 }}
                                            type='checkbox'
                                            // value={props.isOwner ? String(option.isCorrect) : String(solutions[index].selected[i].isSelected)}
                                            checked={solutions[index].selected[i].isSelected}
                                        // onChange={(e) => {
                                        //     const updatedSolution = [...solutions]
                                        //     updatedSolution[index].selected[i].isSelected = !updatedSolution[index].selected[i].isSelected;
                                        //     setSolutions(updatedSolution)
                                        //     props.setSolutions(updatedSolution)
                                        // }}
                                        />
                                    </View>
                                    {
                                        option.option && option.option.includes("image:") ?
                                            (<Image
                                                resizeMode={'contain'}
                                                style={{
                                                    width: 200,
                                                    height: 200
                                                }}
                                                source={{
                                                    uri: option.option.split("image:")[1]
                                                }}
                                            />) :
                                            (
                                                option.option && option.option.includes("formula:") ?
                                                    <View style={{
                                                        borderColor: '#F8F9FA',
                                                        borderWidth: 1,
                                                        borderRadius: 15,
                                                        padding: 10,
                                                        width: '30%'
                                                    }}>
                                                        <EquationEditor
                                                            value={option.option.split("formula:")[1]}
                                                            onChange={() => { return; }}
                                                            autoCommands="pi theta sqrt sum prod alpha beta gamma rho int"
                                                            autoOperatorNames="sin cos tan arccos arcsin arctan"
                                                        />
                                                    </View> :
                                                    <TextInput
                                                        editable={false}
                                                        value={option.option}
                                                        style={{
                                                            width: '50%',
                                                            fontSize: 15,
                                                            padding: 15,
                                                            paddingTop: 12,
                                                            paddingBottom: 12,
                                                            marginTop: 5,
                                                            marginBottom: 20,
                                                            color
                                                        }}
                                                        placeholder={'Option ' + (i + 1).toString()}
                                                        placeholderTextColor={'#818385'}
                                                    />
                                            )
                                    }
                                </View>
                            })
                        }
                        {
                            problem.questionType === "freeResponse" ?
                                <View style={{ width: '100%', paddingHorizontal: 40 }}>
                                    <CustomTextInput
                                        editable={false}
                                        value={solutions[index].response}
                                        placeholder='Answer'
                                        hasMultipleLines={true}

                                    />
                                </View>
                                :
                                null
                        }

                        {!props.isOwner && problemComments[index] === '' ? null : <View style={{ width: '80%', maxWidth: 400, marginLeft: 40 }}>
                            {props.isOwner ? <CustomTextInput
                                editable={props.isOwner ? true : false}
                                value={problemComments[index]}
                                placeholder='Remark'
                                hasMultipleLines={true}
                                onChangeText={(val: any) => {
                                    const updateProblemComments = [...problemComments];
                                    updateProblemComments[index] = val;
                                    setProblemComments(updateProblemComments)
                                }}
                            /> :
                                <View style={{ flexDirection: 'row', width: '100%', marginTop: 20, marginBottom: 40 }}>
                                    <Text style={{ color: '#3b64f8', fontSize: 13, }}>
                                        {problemComments[index]}
                                    </Text>
                                </View>}
                        </View>}
                    </View>
                })
            }
            {!props.isOwner && !comment ? null : <View style={{ width: '100%', paddingVertical: 50, paddingHorizontal: 40, borderTopWidth: 1, borderColor: '#F8F9FA' }}>
                <Text style={{ width: '100%', textAlign: 'left' }}>
                    Feedback
                </Text>
                {props.isOwner ? <View style={{ width: '80%', maxWidth: 400 }}>
                    <CustomTextInput
                        editable={props.isOwner ? true : false}
                        value={comment}
                        onChangeText={(val: any) => setComment(val)}
                        hasMultipleLines={true}
                    />
                </View> :
                    <Text style={{ color: '#3b64f8', fontSize: 15, width: '100%', textAlign: 'left', marginTop: 40 }}>
                        {comment}
                    </Text>
                }
            </View>}

            {/* Add Submit button here */}
            {props.isOwner ? <View
                style={{
                    flex: 1,
                    backgroundColor: 'white',
                    justifyContent: 'center',
                    display: 'flex',
                    flexDirection: 'row',
                    marginTop: 25,
                    marginBottom: 25
                }}>
                <TouchableOpacity
                    onPress={() => props.onGradeQuiz(problemScores, problemComments, Number(percentage), comment)}
                    style={{
                        backgroundColor: 'white',
                        borderRadius: 15,
                        overflow: 'hidden',
                        height: 35,
                    }}>
                    <Text style={{
                        textAlign: 'center',
                        lineHeight: 35,
                        color: 'white',
                        fontSize: 12,
                        backgroundColor: '#3B64F8',
                        paddingHorizontal: 25,
                        fontFamily: 'inter',
                        height: 35
                    }}>
                        SAVE
                    </Text>
                </TouchableOpacity>
            </View> : null}
        </View >
    );
}

export default Quiz;

const styles = StyleSheet.create({
    input: {
        width: '50%',
        // borderBottomColor: '#F8F9FA',
        // borderBottomWidth: 1,
        fontSize: 15,
        paddingTop: 12,
        paddingBottom: 12,
        marginTop: 5,
        marginBottom: 20
    }
});
