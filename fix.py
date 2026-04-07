 
path = 'src/app/trainer/clients/new/page.tsx'
lines = open(path, encoding='utf-8').readlines()
cnt = 0
out = []
for l in lines:
    if l.strip().startswith('const inputCls'):
        cnt += 1
        if cnt == 1:
            out.append(l)
    else:
        out.append(l)
open(path, 'w', encoding='utf-8').writelines(out)
print('done')