const shared = { name: 'akif' }

const list = [shared, shared, shared]

list[0].name = 'bob'

console.log(list[1].name)
console.log(list[2].name)
