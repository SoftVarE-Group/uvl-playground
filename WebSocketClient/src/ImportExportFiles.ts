export function downloadFile(content: string, filename: string): void {
    // Create a Blob from the file content
    const blob = new Blob([content], {type: 'text/plain'});

    // Create a temporary anchor element
    const downloadLink = document.createElement('a');

    // Set the link's href attribute to the Blob URL
    let url = URL.createObjectURL(blob);
    downloadLink.href = url;

    // Set the download attribute with the desired file name
    downloadLink.download = `${filename}.uvl`;
    document.body.appendChild(downloadLink);

    // Trigger a click on the link to start the download
    downloadLink.click();

    // Clean up
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
}

export function uploadFile(): Promise<string> {
    const uploadInput: HTMLInputElement|null = document.querySelector('#uploadInput');
    if(uploadInput){
        uploadInput.click();
        return new Promise<string>((resolve, reject) => {
            uploadInput.onchange = () => {
                if(!uploadInput.files){
                    reject();
                    return;
                }
                const file = uploadInput.files[0];
                let stringPromise = file.text();
                uploadInput.files = null;
                uploadInput.value = "";
                stringPromise.then((res) => {
                    resolve(res);
                });
            };
        })
    }
    return new Promise((_resolve, reject) => reject());
}