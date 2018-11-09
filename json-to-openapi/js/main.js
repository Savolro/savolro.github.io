const indentSize = 2
var exampleData = {}

function updateOutputField() {
  let input = document.getElementById("input").value
  let outputElement = document.getElementById("output")
  let data = {}

  let generateExamples = document.getElementById("generate-examples").checked
  let valuesAsTypes = document.getElementById("values-as-types").checked
  let exampleInputElement = document.getElementById("example-input")
  exampleInputElement.style.display = !(generateExamples && valuesAsTypes) ? 'none' : 'inline'
  document.getElementById('example-input-label').style.display = !(generateExamples && valuesAsTypes) ? 'none' : 'inline'
  if (input != '') {
    try {
      data = JSON.parse(input)
    }
    catch (e) {
      outputElement.value = "JSON input is invalid"
      return
    }
  }
  let convertType = ''
  // We use string here because it is not clear whether additional exclussive
  // input formats will will be needed
  if (valuesAsTypes) {
    convertType = 'VALUE_AS_TYPE'
    if (generateExamples) {
      let exampleInput = exampleInputElement.value
      if (exampleInput != '') {
        try {
          exampleData = JSON.parse(exampleInput)
        }
        catch (e) {
          outputElement.value = "JSON input is invalid"
          return
        }
      }
    }
  }
  let out = convert(data, '', 0, true, generateExamples, convertType)

  if(input != '')
    outputElement.value = out
  exampleData = {}
}

function convert(obj, name, indent, root, examples, convertType) {
  let output = ''
  let indents = ' '.repeat(indent)
  let type = (typeof obj).toString()
  let format = ''

  // Adjust JS types to Swagger types
  switch (type) {
    case 'object':
      if (Array.isArray(obj))
        type = 'array'
      break
    case 'number':
      if (Number.isInteger(obj))
        type = 'integer'
    case 'string':
      if (isNaN(obj)) {
        var timestamp = Date.parse(obj)
        if (!isNaN(timestamp)) {
          var date = new Date(new Date(timestamp))
          format = 'date'
          if (date.getUTCMilliseconds() != 0 || date.getUTCSeconds() != 0 || date.getUTCMinutes() != 0 || date.getUTCHours() != 0)
            format = 'date-time'
        }
      }
      break
  }

  // If we are using values as types, convert specific types
  if (convertType == 'VALUE_AS_TYPE' && type != 'object' && type != 'array') {
    type = obj
    switch (obj) {
      case 'date':
        type = 'string'
        format = 'date'
        break
    }
  }

  // Append beginning of field definition
  if (name != '') {
    output += indents + name + ':\n'
  }
  let additionalIntents = ' '.repeat(indentSize)
  if (root)
    additionalIntents = ''

  // Append type property to output
  output += indents + additionalIntents  + 'type: ' + type + '\n'

  // If format exists, append format property to output
  if (format != '')
    output += indents + additionalIntents  + 'format: ' + format + '\n'

  // If current object is array, convert its first element
  // TODO: avoid null errors (check array size)
  // TODO: check all elements for multi-type arrays
  if (type == 'array') {
    output += indents + '  items:\n'
    output += convert(obj[0], '', indent + indentSize, false, examples, convertType)
  }

  // IF current object is JS object, convert all its fields recursively
  else if (type == 'object') {
    output += indents + additionalIntents + 'properties:\n'
    for (let key in obj)
      if (obj.hasOwnProperty(key))
        output += convert(obj[key], key, indent + (root ? 1 : 2) * indentSize, false, examples, convertType)
  }

  // generate examples for 'simple' types
  else if (examples) {
    // If types are defined by values, use value from example data
    if (convertType == 'VALUE_AS_TYPE' && exampleData[name] !== undefined)
      output += indents + additionalIntents + 'example: ' + exampleData[name] + '\n'
    // normal case: just print current object as example value
    else if (convertType != "VALUE_AS_TYPE")
      output += indents + additionalIntents + 'example: ' + obj + '\n'
  }
  return output
}
