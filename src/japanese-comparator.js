const exec = require('child_process').execSync
const isWindows = require('is-windows')
let Encoding
Encoding = require('encoding-japanese')
const fs = require("fs")

function hiraToKana(str) {
  return str.replace(/[\u3041-\u3096]/g, function(match) {
    var chr = match.charCodeAt(0) + 0x60;
    return String.fromCharCode(chr);
  });
}

const dakuMap = hiraToKana('かが きぎ くぐ けげ こご さざ しじ すず せぜ そぞ ただ ちぢ つづ てで とど はばぱ ひびぴ ふぶぷ へべぺ ほぼぽ')
  .split(/\s/g)
  .reduce((prev, current) => {
    [...current].map(c => {
      prev[c] = current
    })
    return prev
  }, {})

function compareKana(a, b) {
  if (a[0] === undefined && b[0] === undefined) {
    return 0
  } else if (a[0] === undefined) {
    return -1
  } else if (b[0] === undefined) {
    return 1
  } else if (a[0] === b[0]) {
    return compareKana(a.substring(1), b.substring(1))
  } else if (
    dakuMap[a[0]] && dakuMap[b[0]] && dakuMap[a[0]] === dakuMap[b[0]]
  ) {
    return dakuMap[a[0]].indexOf(a[0]) - dakuMap[a[0]].indexOf(b[0])
  } else {
    return a[0].localeCompare(b[0], 'ja')
  }
}

class JapaneseComparator {
  constructor(command, resultParser, noAutoCache) {
    if (isWindows()) {
      this.detected = Encoding.detect(exec(`echo テキストエンコーディングのテスト | mecab -Oyomi`))
    }
    this.splitter = '\\\\\\'
    this.command = command || 'mecab -Oyomi'
    this.resultParser = resultParser || (output => output.trim())
    this.noAutoCache = noAutoCache
    this.cache = {}
  }
  execCommand(str) {
    const command = `echo ${str} | ${this.command}`
    let result
    if (this.detected) {
      result = Encoding.convert(exec(command), {
        from: this.detected,
        type: 'string'
      })
    } else {
      result = exec(command)
    }
    return this.resultParser(result)
  }
  execCommandFile(str) {
    const command = `cat ${str} | tr -d \r?\n | ${this.command}`
    let result
    if (this.detected) {
      result = Encoding.convert(exec(command), {
        from: this.detected,
        type: 'string'
      })
    } else {
      result = exec(command)
    }
    return this.resultParser(result)
  }
  kanjiToKana(str, noAutoCache,isfile) {
    if (!isfile){
    str = str.trim()
    noAutoCache = noAutoCache || this.noAutoCache
    const cached = this.cache[str]
    if (cached !== undefined) {
      return cached
    } else {
      const result = hiraToKana(this.execCommand(str))
      if (!noAutoCache) {
        this.cache[str] = result
      }
      return result
    }
  } else{
      const result = hiraToKana(this.execCommandFile(str))
      return result
    }
  }
  preprocess(list) {
    return list.map(s => s.trim())
  }
  createCache(list) {
    list = this.preprocess(list)
    let str1=""
    for (let i=0;i<list.length;i++){
      str1=str1+list[i]
      if (i<list.length-1 && str1.length<=6000){
        str1=str1+this.splitter
      } else {
        const yomiAll = this.kanjiToKana(str1, true,false).split(this.splitter)
        console.log(yomiAll)
        str1.split(this.splitter).forEach((str, i) => {
        this.cache[str] = yomiAll[i]
        str1=""
    })
      }
    
    }
    
  }
  createCacheFile(str1) {
        const yomiAll = this.kanjiToKana(str1, true,true).split(this.splitter)
        const buffer = fs.readFileSync(str1);
        const text = Encoding.convert(buffer, {
          from: 'SJIS',
          type: 'string',
        });
        text.split(this.splitter).forEach((str, i) => {
        this.cache[str] = yomiAll[i]
        })
    
  }
  clearCache() {
    this.cache = {}
  }
  get(list,isfile) {
    if (!this.noAutoCache && list && !isfile) {
      this.createCache(list)
    }
    else if(!this.noAutoCache && list && isfile){
      this.createCacheFile(list)
      console.log(this.cache)
    }
    return (a, b) => compareKana(this.kanjiToKana(a), this.kanjiToKana(b))
  }
}

module.exports = JapaneseComparator