const exec = require('child_process').execSync
const isWindows = require('is-windows')
let Encoding
if (isWindows()) {
  Encoding = require('encoding-japanese')
}

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
  kanjiToKana(str, noAutoCache) {
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
  }
  preprocess(list) {
    return list.map(s => s.trim())
  }
  createCache(list) {
    list = this.preprocess(list)
    let str1=""
    for (let i=0;i<list.length;i++){
      str1=str1+list[i]
      if (i<list.length-1 && str1.length<=2000){
        str1=str1+this.splitter
      } else {
        const yomiAll = this.kanjiToKana(str1, true).split(this.splitter)
        console.log(yomiAll)
        str1.split(this.splitter).forEach((str, i) => {
        this.cache[str] = yomiAll[i]
        str1=""
    })
      }
    
    }
    
  }
  clearCache() {
    this.cache = {}
  }
  get(list) {
    if (!this.noAutoCache && list) {
      this.createCache(list)
    }
    return (a, b) => compareKana(this.kanjiToKana(a), this.kanjiToKana(b))
  }
}

module.exports = JapaneseComparator