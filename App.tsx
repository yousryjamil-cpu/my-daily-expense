import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Currency = 'SAR' | 'BDT';
type Kind = 'income' | 'expense';
type Transaction = { id: string; kind: Kind; amount: number; currency: Currency; category: string; note: string; date: string };
const STORE = 'my-daily-expense-transactions-v1';
const categories = ['Salary', 'Food', 'Transport', 'Shopping', 'Family', 'Bills', 'Other'];
const words = {
  en: { title: 'My Daily Expense', balance: 'Balance', income: 'Income', expense: 'Expense', add: 'Save transaction', amount: 'Amount', note: 'Note (optional)', history: 'Transactions', empty: 'No transactions yet', month: 'This month', delete: 'Delete', edit: 'Edit', cancel: 'Cancel', update: 'Update transaction', invalid: 'Enter a valid amount', category: 'Category', language: 'বাংলা', confirm: 'Delete this transaction?', yes: 'Delete', no: 'Cancel', all: 'All time' },
  bn: { title: 'আমার আয়-ব্যয়', balance: 'ব্যালেন্স', income: 'আয়', expense: 'খরচ', add: 'লেনদেন সংরক্ষণ', amount: 'টাকার পরিমাণ', note: 'বিবরণ (ঐচ্ছিক)', history: 'লেনদেনের তালিকা', empty: 'এখনো কোনো লেনদেন নেই', month: 'এই মাস', delete: 'মুছুন', edit: 'সম্পাদনা', cancel: 'বাতিল', update: 'পরিবর্তন সংরক্ষণ', invalid: 'সঠিক পরিমাণ লিখুন', category: 'বিভাগ', language: 'English', confirm: 'এই লেনদেন মুছবেন?', yes: 'মুছুন', no: 'বাতিল', all: 'সর্বমোট' }
};
export default function App() {
  const [items, setItems] = useState<Transaction[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [lang, setLang] = useState<'en' | 'bn'>('bn');
  const [currency, setCurrency] = useState<Currency>('SAR');
  const [kind, setKind] = useState<Kind>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [note, setNote] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const t = words[lang];
  useEffect(() => { AsyncStorage.getItem(STORE).then(raw => { if (raw) { const data = JSON.parse(raw); if (Array.isArray(data)) setItems(data); } }).catch(() => Alert.alert('Storage error', 'Could not load saved transactions')).finally(() => setLoaded(true)); }, []);
  useEffect(() => { if (loaded) AsyncStorage.setItem(STORE, JSON.stringify(items)).catch(() => Alert.alert('Storage error', 'Could not save transactions')); }, [items, loaded]);
  const totals = useMemo(() => {
    const selected = items.filter(x => x.currency === currency);
    const month = new Date().toISOString().slice(0, 7);
    const sum = (arr: Transaction[], k: Kind) => arr.filter(x => x.kind === k).reduce((s, x) => s + x.amount, 0);
    return { income: sum(selected, 'income'), expense: sum(selected, 'expense'), monthlyIncome: sum(selected.filter(x => x.date.startsWith(month)), 'income'), monthlyExpense: sum(selected.filter(x => x.date.startsWith(month)), 'expense') };
  }, [items, currency]);
  const money = (n: number) => `${n.toFixed(2)} ${currency}`;
  const clear = () => { setAmount(''); setNote(''); setEditing(null); setCategory('Food'); setKind('expense'); };
  const save = () => {
    const n = Number(amount.replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) return Alert.alert(t.invalid);
    if (editing) setItems(old => old.map(x => x.id === editing ? { ...x, amount: n, kind, category, note: note.trim(), currency } : x));
    else setItems(old => [{ id: `${Date.now()}-${Math.random()}`, amount: n, kind, category, note: note.trim(), currency, date: new Date().toISOString() }, ...old]);
    clear();
  };
  const edit = (x: Transaction) => { setEditing(x.id); setCurrency(x.currency); setKind(x.kind); setAmount(String(x.amount)); setCategory(x.category); setNote(x.note); };
  const remove = (id: string) => Alert.alert(t.delete, t.confirm, [{ text: t.no, style: 'cancel' }, { text: t.yes, style: 'destructive', onPress: () => { setItems(old => old.filter(x => x.id !== id)); if (editing === id) clear(); } }]);
  const choice = (label: string, active: boolean, onPress: () => void) => <TouchableOpacity onPress={onPress} style={[styles.choice, active && styles.active]}><Text style={[styles.choiceText, active && styles.activeText]}>{label}</Text></TouchableOpacity>;
  return <SafeAreaView style={styles.root}><StatusBar barStyle="dark-content"/><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><Text style={styles.title}>{t.title}</Text><TouchableOpacity onPress={() => setLang(x => x === 'bn' ? 'en' : 'bn')}><Text style={styles.link}>{t.language}</Text></TouchableOpacity></View>
    <View style={styles.row}>{choice('SAR', currency === 'SAR', () => setCurrency('SAR'))}{choice('BDT', currency === 'BDT', () => setCurrency('BDT'))}</View>
    <View style={styles.hero}><Text style={styles.heroLabel}>{t.balance} · {t.all}</Text><Text style={styles.heroValue}>{money(totals.income - totals.expense)}</Text><View style={styles.stats}><View><Text style={styles.heroLabel}>{t.income}</Text><Text style={styles.statText}>{money(totals.income)}</Text></View><View><Text style={styles.heroLabel}>{t.expense}</Text><Text style={styles.statText}>{money(totals.expense)}</Text></View></View></View>
    <View style={styles.panel}><Text style={styles.section}>{t.month}</Text><Text style={styles.body}>{t.income}: {money(totals.monthlyIncome)}    {t.expense}: {money(totals.monthlyExpense)}</Text></View>
    <View style={styles.panel}><View style={styles.row}>{choice(t.income, kind === 'income', () => { setKind('income'); setCategory('Salary'); })}{choice(t.expense, kind === 'expense', () => { setKind('expense'); setCategory('Food'); })}</View>
    <Text style={styles.label}>{t.amount} ({currency})</Text><TextInput keyboardType="decimal-pad" value={amount} onChangeText={setAmount} placeholder="0.00" style={styles.input}/>
    <Text style={styles.label}>{t.category}</Text><View style={styles.wrap}>{categories.map(c => <View key={c}>{choice(c, category === c, () => setCategory(c))}</View>)}</View>
    <Text style={styles.label}>{t.note}</Text><TextInput value={note} onChangeText={setNote} placeholder="..." style={styles.input}/>
    <TouchableOpacity style={styles.save} onPress={save}><Text style={styles.saveText}>{editing ? t.update : t.add}</Text></TouchableOpacity>{editing && <TouchableOpacity onPress={clear}><Text style={styles.link}>{t.cancel}</Text></TouchableOpacity>}</View>
    <Text style={styles.section}>{t.history} · {currency}</Text>
    {items.filter(x => x.currency === currency).length === 0 ? <Text style={styles.empty}>{t.empty}</Text> : items.filter(x => x.currency === currency).map(x => <View style={styles.transaction} key={x.id}><View style={{ flex: 1 }}><Text style={styles.itemTitle}>{x.category} {x.note ? `· ${x.note}` : ''}</Text><Text style={styles.small}>{new Date(x.date).toLocaleDateString()}</Text><View style={styles.row}><TouchableOpacity onPress={() => edit(x)}><Text style={styles.link}>{t.edit}</Text></TouchableOpacity><TouchableOpacity onPress={() => remove(x.id)}><Text style={styles.danger}>{t.delete}</Text></TouchableOpacity></View></View><Text style={[styles.itemAmount, { color: x.kind === 'income' ? '#087f5b' : '#b42318' }]}>{x.kind === 'income' ? '+' : '-'}{x.amount.toFixed(2)}</Text></View>)}
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: '#f4f6fa', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0 }, page: { padding: 18, paddingBottom: 48 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }, title: { fontSize: 24, fontWeight: '800', color: '#17233b' }, link: { color: '#315ec7', fontWeight: '700', marginTop: 8 }, row: { flexDirection: 'row', gap: 10, alignItems: 'center' }, choice: { backgroundColor: '#e9edf5', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 12, marginBottom: 8 }, active: { backgroundColor: '#315ec7' }, choiceText: { color: '#24334f', fontWeight: '600' }, activeText: { color: 'white' }, hero: { backgroundColor: '#1b356c', padding: 22, borderRadius: 22, marginVertical: 10 }, heroLabel: { color: '#cbd7f3', fontSize: 13 }, heroValue: { color: 'white', fontSize: 29, fontWeight: '800', marginTop: 8 }, stats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 }, statText: { color: 'white', fontWeight: '700', marginTop: 5 }, panel: { backgroundColor: 'white', borderRadius: 18, padding: 17, marginVertical: 9 }, section: { fontSize: 18, fontWeight: '800', color: '#17233b', marginBottom: 10 }, body: { color: '#36425b' }, label: { fontSize: 14, fontWeight: '700', marginTop: 10, marginBottom: 7, color: '#34415c' }, input: { backgroundColor: '#f5f7fb', borderWidth: 1, borderColor: '#dce2ed', borderRadius: 12, padding: 12, fontSize: 17 }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 }, save: { backgroundColor: '#315ec7', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 18 }, saveText: { color: 'white', fontWeight: '800', fontSize: 16 }, empty: { color: '#64748b', textAlign: 'center', padding: 22 }, transaction: { flexDirection: 'row', backgroundColor: 'white', padding: 16, borderRadius: 14, marginBottom: 10, gap: 8 }, itemTitle: { color: '#17233b', fontWeight: '700' }, small: { color: '#718096', marginTop: 5 }, itemAmount: { fontWeight: '800', fontSize: 16 }, danger: { color: '#b42318', fontWeight: '700', marginTop: 8 } });
