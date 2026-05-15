
export const  extractKeywords = (text) =>{
    return text.toLowerCase()
    .match(/\b\w+\b/g)
}