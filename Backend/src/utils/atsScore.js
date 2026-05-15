
export const calculateATSScore = (jdKeywords,resumeKeywords) =>{
    const uniqueJD = [...new Set(jdkeywords)];
    const matches = uniqueJD.filter(keyword => resumeKeywords.includes(keyword));
    const score = (matches.length / uniqueJD.length) * 100;
    return Math.round(score);
}