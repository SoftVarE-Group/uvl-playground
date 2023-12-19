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

export function uploadFile(): string {
    const inputElement = document.createElement('input');
    inputElement.type = "file";
    inputElement.style.visibility = "false";
    document.body.appendChild(inputElement);

    inputElement.click();

    document.body.removeChild(inputElement);

    return "";
}