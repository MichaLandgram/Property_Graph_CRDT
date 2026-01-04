const { exec } = require('child_process');
const fs = require('fs');

exec('npm test src/Tests/Fixed_Schema_Tests/Simple.test.tsx', { cwd: 'c:\\Programmieren\\MasterThesis\\MainDev\\Master_Thesis\\MasterReactApp_ts\\my-app' }, (error, stdout, stderr) => {
    const output = `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`;
    fs.writeFileSync('test_output.txt', output);
});
