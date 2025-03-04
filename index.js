const { getAllFilePathsWithExtension, readFile } = require('./fileSystem');
const { readLine } = require('./console');
const path = require('path');

const filePaths = getAllFilePathsWithExtension(process.cwd(), 'js');
const files = filePaths.map(filePath => ({ filePath, content: readFile(filePath) }));
const todos = extractTodos(files);

console.log('Please, write your command!');
readLine(processCommand);

function extractTodos(files) {
    const todoRegex = /\/\/ TODO (.+)/g;
    let todos = [];
    
    files.forEach(({ filePath, content }) => {
        let match;
        while ((match = todoRegex.exec(content)) !== null) {
            todos.push({ filePath: path.basename(filePath), text: match[1] });
        }
    });
    
    return todos;
}

function processCommand(command) {
    if (command.startsWith('user ')) {
        const username = command.split(' ')[1];
        showUserTodos(username);
        return;
    }
    if (command.startsWith('sort ')) {
        const criterion = command.split(' ')[1];
        sortTodos(criterion);
        return;
    }
    if (command.startsWith('date ')) {
        const dateStr = command.split(' ')[1];
        showTodosAfterDate(dateStr);
        return;
    }
    
    switch (command) {
        case 'exit':
            process.exit(0);
            break;
        case 'show':
            showTodos();
            break;
        case 'important':
            showImportantTodos();
            break;
        default:
            console.log('wrong command');
            break;
    }
}

function formatTodoTable(todos) {
    let tableData = todos.map(({ filePath, text }) => {
        const importance = text.includes('!') ? '!' : ' ';
        const user = text.match(/^([^;]+);/)?.[1] || '';
        const date = text.match(/;\s*(\d{4}-\d{2}-\d{2})/)?.[1] || '';
        let comment = text.split(/;\s*\d{4}-\d{2}-\d{2}\s*;/).pop() || text;
        return { importance, user, date, comment, filePath };
    });

    let maxWidths = [1, 10, 10, 50, 15];
    maxWidths[1] = Math.min(10, Math.max(...tableData.map(row => row.user.length), 4));
    maxWidths[2] = Math.min(10, Math.max(...tableData.map(row => row.date.length), 4));
    maxWidths[3] = Math.min(50, Math.max(...tableData.map(row => row.comment.length), 7));
    maxWidths[4] = Math.min(15, Math.max(...tableData.map(row => row.filePath.length), 7));

    const header = ['!', 'user', 'date', 'comment', 'file'].map((h, i) => h.padEnd(maxWidths[i])).join('  |  ');
    const separator = '-'.repeat(header.length);
    console.log(header);
    console.log(separator);
    
    tableData.forEach(row => {
        const user = row.user.padEnd(maxWidths[1]);
        const date = row.date.padEnd(maxWidths[2]);
        const comment = row.comment.length > maxWidths[3] ? row.comment.slice(0, maxWidths[3] - 3) + '...' : row.comment;
        const file = row.filePath.padEnd(maxWidths[4]);
        console.log(
            `${row.importance.padEnd(maxWidths[0])}  |  ${user}  |  ${date}  |  ${comment}  |  ${file}`
        );
    });
    console.log(separator);
}

function showTodos() {
    formatTodoTable(todos);
}

function showImportantTodos() {
    const importantTodos = todos.filter(todo => todo.text.includes('!'));
    formatTodoTable(importantTodos);
}

function showUserTodos(username) {
    const userTodos = todos.filter(todo => todo.text.startsWith(`${username};`));
    if (userTodos.length === 0) {
        console.log(`No TODOs found for user: ${username}`);
    } else {
        formatTodoTable(userTodos);
    }
}


function sortTodos(criterion) {
    let sortedTodos;
    switch (criterion) {
        case 'importance':
            sortedTodos = todos.slice().sort((a, b) => (b.text.match(/!/g) || []).length - (a.text.match(/!/g) || []).length);
            break;
        case 'user':
            sortedTodos = todos.slice().sort((a, b) => {
                const userA = a.text.match(/^([^;]+);/)?.[1] || 'zzz';
                const userB = b.text.match(/^([^;]+);/)?.[1] || 'zzz';
                return userA.localeCompare(userB);
            });
            break;
        case 'date':
            sortedTodos = todos.slice().sort((a, b) => {
                const dateA = a.text.match(/;\s*(\d{4}-\d{2}-\d{2})/)?.[1];
                const dateB = b.text.match(/;\s*(\d{4}-\d{2}-\d{2})/)?.[1];
                if (!dateA) return 1;
                if (!dateB) return -1;
                return new Date(dateB) - new Date(dateA);
            });
            break;
        default:
            console.log('wrong sort criterion');
            return;
    }
    formatTodoTable(sortedTodos);
}

function showTodosAfterDate(dateStr) {
    const parsedDate = new Date(dateStr);
    if (isNaN(parsedDate)) {
        console.log('Invalid date format. Use yyyy, yyyy-mm, or yyyy-mm-dd');
        return;
    }
    
    const filteredTodos = todos.filter(todo => {
        const match = todo.text.match(/;\s*(\d{4}-\d{2}-\d{2})/);
        if (!match) return false;
        const todoDate = new Date(match[1]);
        return todoDate > parsedDate;
    });
    
    formatTodoTable(filteredTodos);
}
