import Papa from 'papaparse';
import cantosCSV from './cantos.csv?url';

export const loadCantos = async () => {
    const response = await fetch(cantosCSV);
    const csvText = await response.text();

    const { data } = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true
    });

    // Retorna lista de cantos [{ NOME: 'Canto 1', NUMERO: '123' }, ...]
    return data.map(row => ({ nome: row['NOME DO CANTO'], numero: row['NÚMERO'] }));
};
