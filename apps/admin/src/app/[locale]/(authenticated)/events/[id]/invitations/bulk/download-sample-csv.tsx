"use client";

const SAMPLE_CSV = `email,first_name,last_name,country,occupation,category_tags,tier_slug,locale,note
ada.lovelace@example.com,Ada,Lovelace,GB,Mathematician,press;diaspora,vip,en,Keynote context
ousmane.sow@example.com,Ousmane,Sow,SN,Sculptor,diaspora,general,fr,
ingrid.jonker@example.com,Ingrid,Jonker,ZA,Journalist,press,press,en,Attending day 1 only`;

export function DownloadSampleCsv() {
  function handleDownload() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invitations-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="text-primary underline hover:opacity-80"
    >
      Download sample CSV
    </button>
  );
}
